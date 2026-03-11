import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
// Set this to YOUR verified email to receive all test emails.
// Once you add a verified domain in Resend, remove this line and the redirect logic below.
const TEST_EMAIL_OVERRIDE = Deno.env.get('TEST_EMAIL_OVERRIDE')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables.")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Date range: previous month start → end of current month (broad for testing)
    const today = new Date()
    const firstDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const prevMonthStr = firstDayOfPreviousMonth.toISOString().split('T')[0]
    const endCurrentMonthStr = endOfCurrentMonth.toISOString().split('T')[0]

    // 1. Get all users via Admin API
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    // 2. Get all profiles for user names
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*')
    if (profilesError) throw profilesError

    let emailsSent = 0
    const resendErrors: string[] = []
    const debugUsers: string[] = []

    for (const user of users) {
      const email = user.email
      if (!email) continue

      debugUsers.push(email)

      const profile = profiles?.find((p: { id: string }) => p.id === user.id)
      const name = profile ? profile.name : 'Usuário'

      // Fetch Debit Transactions
      const { data: debits } = await supabase
        .from('debit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', prevMonthStr)
        .lte('date', endCurrentMonthStr)

      // Fetch Credit Expenses
      const { data: credits } = await supabase
        .from('credit_expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', prevMonthStr)
        .lte('date', endCurrentMonthStr)

      // Fetch all Installments
      const { data: installments } = await supabase
        .from('installments')
        .select('*')
        .eq('user_id', user.id)

      let totalIncome = 0
      let totalDebitExpense = 0
      let totalCreditExpense = 0
      let totalInstallments = 0

      if (debits) {
        debits.forEach((d: { type: string; amount: number }) => {
          if (d.type === 'income') totalIncome += Number(d.amount)
          else totalDebitExpense += Number(d.amount)
        })
      }

      if (credits) {
        credits.forEach((c: { amount: number }) => totalCreditExpense += Number(c.amount))
      }

      if (installments) {
        installments.forEach((i: { date: string; installment_amount: number }) => {
          const instDate = new Date(i.date)
          if (instDate <= endOfCurrentMonth) {
            totalInstallments += Number(i.installment_amount)
          }
        })
      }

      const totalExpenses = totalDebitExpense + totalCreditExpense + totalInstallments
      const balance = totalIncome - totalExpenses

      const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #3B82F6;">Resumo Financeiro Mensal</h2>
          <p>Olá <strong>${name}</strong>,</p>
          <p>Aqui está o seu resumo financeiro referente ao último mês:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Receitas (Entradas):</strong> <span style="color: #10B981;">${formatCurrency(totalIncome)}</span></p>
            <p style="margin: 5px 0;"><strong>Despesas (Débito/Pix):</strong> <span style="color: #EF4444;">${formatCurrency(totalDebitExpense)}</span></p>
            <p style="margin: 5px 0;"><strong>Despesas (Crédito):</strong> <span style="color: #F59E0B;">${formatCurrency(totalCreditExpense)}</span></p>
            <p style="margin: 5px 0;"><strong>Parcelas:</strong> <span style="color: #F59E0B;">${formatCurrency(totalInstallments)}</span></p>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 15px 0;"/>
            <p style="margin: 5px 0; font-size: 1.1em;"><strong>Saldo Total:</strong>
              <span style="color: ${balance >= 0 ? '#10B981' : '#EF4444'};">${formatCurrency(balance)}</span>
            </p>
          </div>
          <p>Acesse o <a href="https://financeiro.seuprojeto.com" style="color: #3B82F6;">Planner Financeiro</a> para ver os detalhes completos.</p>
          <p style="font-size: 0.8em; color: #666;">Este é um e-mail automático, por favor não responda.</p>
        </div>
      `

      // Send via Resend
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: 'Planner Financeiro <onboarding@resend.dev>',
          // In sandbox (no verified domain), redirect all emails to your own email.
          // Once you add a verified domain in Resend, remove TEST_EMAIL_OVERRIDE and use `to: [email]`
          to: [TEST_EMAIL_OVERRIDE || email],
          subject: `[${name}] Resumo Financeiro Mensal`,
          html: htmlContent
        })
      })

      if (res.ok) {
        emailsSent++
      } else {
        const errText = await res.text()
        resendErrors.push(`${email}: ${errText}`)
        console.error(`Failed to send email to ${email}:`, errText)
      }
    }

    return new Response(JSON.stringify({
      success: true,
      usersFound: users.length,
      emailsSent,
      resendErrors,
      debugUsers
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(err)
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
