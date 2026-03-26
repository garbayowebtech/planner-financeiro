import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Variáveis de ambiente ausentes no servidor.")
    }

    // ── 1. Autenticar o usuário via token JWT ─────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // Use anon client to validate the user's JWT
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    console.log("Validating token...")
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token)
    
    if (authError || !user) {
      console.error("Auth error details:", authError?.message)
      return new Response(JSON.stringify({ error: 'Token inválido ou expirado.', details: authError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    console.log("Token valid for user:", user.id)

    // ── 2. Ler body da requisição ─────────────────────────────────
    const { promptData, monthYear } = await req.json()
    if (!promptData || !monthYear) {
      return new Response(JSON.stringify({ error: 'Dados incompletos na requisição.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // ── 3. Trava por usuário: verificar uso mensal ─────────────────
    // Use service role to bypass RLS for the check
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: existingReport } = await supabaseAdmin
      .from('ai_reports')
      .select('id')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .maybeSingle()

    if (existingReport) {
      return new Response(JSON.stringify({
        error: 'limite_mensal',
        message: 'Você já utilizou o relatório de IA neste mês. Seu próximo relatório estará disponível no mês que vem! 📅',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Returning 200 so supabase-js reads the JSON body
      })
    }

    // ── 4. Chamar a API do Google Gemini ──────────────────────────
    // Limpando possível whitespace na chave
    const cleanApiKey = GEMINI_API_KEY.trim()
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanApiKey}`

    const geminiBody = {
      contents: [{
        parts: [{
          text: `Você é um assistente financeiro pessoal inteligente e simpático, especializado em finanças pessoais brasileiras. Analise os dados financeiros abaixo e forneça um relatório longo e detalhado em português do Brasil, claro, organizado em seções com títulos, com insights práticos e dicas personalizadas. Use markdown com emojis para tornar a leitura agradável. Seja honesto mas encorajador.\n\n${promptData}`,
        }],
      }]
    }

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    })

    // ── 5. Tratar erro do Gemini ────────────────────────────────
    if (geminiRes.status === 429) {
      return new Response(JSON.stringify({
        error: 'cota_gemini',
        message: 'O sistema está no limite de requisições do Gemini no momento. Seu uso mensal NÃO foi descontado. Tente novamente em alguns minutos. ⏳',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Returning 200 so supabase-js reads the JSON body
      })
    }

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      console.error('Gemini error:', geminiRes.status, errBody)
      return new Response(JSON.stringify({
        error: 'gemini_error',
        message: `Houve um problema de comunicação com a IA (Google API Error ${geminiRes.status}). Verifique se sua Chave da API foi inserida corretamente no painel do Supabase. Detalhes ocultos nos logs. 🔄`,
        details: errBody
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Returning 200 so supabase-js reads the JSON body
      })
    }

    const geminiData = await geminiRes.json()
    const parts = geminiData?.candidates?.[0]?.content?.parts || []
    const aiText = parts.map((p: any) => p.text || '').join('')

    if (!aiText) {
      return new Response(JSON.stringify({
        error: 'resposta_vazia',
        message: 'A IA não retornou texto na resposta. Seu uso mensal não foi descontado. Tente novamente. 🔄',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Returning 200 so supabase-js reads the JSON body
      })
    }

    // ── 6. Registrar uso APENAS após sucesso ──────────────────────
    const { error: insertError } = await supabaseAdmin
      .from('ai_reports')
      .insert({ user_id: user.id, month_year: monthYear, report_text: aiText })

    if (insertError) {
      console.warn('Failed to record AI report usage (possible race condition):', insertError.message)
    }

    const finishReason = geminiData?.candidates?.[0]?.finishReason

    // ── 7. Retornar sucesso com o texto da IA ─────────────────────
    return new Response(JSON.stringify({ success: true, report: aiText, finishReason: finishReason }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Edge Function error:', err)
    // Returning 200 so the user sees the error on the screen explicitly
    return new Response(JSON.stringify({ error: 'gemini_error', message: `Erro interno no servidor: ${msg}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
