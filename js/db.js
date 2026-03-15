/**
 * db.js — Supabase Database Layer
 * Centralizes all database interactions for the Financial Planner.
 */

const SUPABASE_URL = 'https://ctveuoeoyymzozzwqqln.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0eXOKvszzLOxPlP6cf7MbQ_DgHpF9gd';
// Limpeza de emergência: Previne falha do Supabase ao tentar dar parse numa JWT quebrada no cache!
const tokenKey = 'sb-ctveuoeoyymzozzwqqln-auth-token';
try {
    const rawToken = localStorage.getItem(tokenKey);
    if (rawToken && !rawToken.startsWith('{')) {
        localStorage.removeItem(tokenKey);
    } else if (rawToken) {
        JSON.parse(rawToken);
    }
} catch (err) {
    localStorage.removeItem(tokenKey);
    console.warn("Lixo do Supabase JWT limpo na inicializacao.");
}

// Initialize the Supabase client (requires @supabase/supabase-js CDN loaded first)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DB = {

    // ================================================================
    // AUTH
    // ================================================================

    async signUp(email, password, name) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { name } }
        });
        if (error) throw error;
        return data; // { user, session }  session is null if email confirmation required
    },

    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
    },

    async signInWithGoogle() {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname
            }
        });
        if (error) throw error;
        return data; // Note: typically redirects, so execution may not reach here
    },

    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    async getSession() {
        const { data } = await supabaseClient.auth.getSession();
        return data.session;
    },

    async sendPasswordReset(email) {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href
        });
        if (error) throw error;
    },

    async updatePassword(newPassword) {
        const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
        if (error) throw error;
    },

    async updateEmail(newEmail) {
        const { error } = await supabaseClient.auth.updateUser({ email: newEmail });
        if (error) throw error;
    },

    // ================================================================
    // PROFILE
    // ================================================================

    async getProfile(userId) {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
        // maybeSingle() retorna null sem lançar exceção se não houver linha
        if (error) throw error;
        if (!data) throw new Error('Perfil não encontrado para o usuário. Sessão pode estar expirada.');
        return data;
    },

    async updateProfileName(userId, name) {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ name })
            .eq('id', userId);
        if (error) throw error;
    },

    async updateProfileSettings(userId, settings) {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ settings })
            .eq('id', userId);
        if (error) throw error;
    },

    async updateProfileAvatar(userId, avatarUrl) {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', userId);
        if (error) throw error;
    },

    // ================================================================
    // STORAGE
    // ================================================================

    async uploadAvatar(userId, file) {
        // Upload the file to 'avatars' bucket, storing it as 'user_id' to overwrite previous files
        // and avoid orphans. Adding a query string to avoid caching issues later.
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}.${fileExt}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('avatars')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabaseClient.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    // ================================================================
    // CATEGORIES
    // ================================================================

    async getCategories(userId) {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .eq('user_id', userId)
            .order('created_at');
        if (error) throw error;
        return (data || []).map(c => ({
            id: c.id, name: c.name, color: c.color,
            textColor: c.text_color, goal: parseFloat(c.goal)
        }));
    },

    async createCategory(userId, cat) {
        const { data, error } = await supabaseClient
            .from('categories')
            .insert([{
                user_id: userId, name: cat.name, color: cat.color,
                text_color: cat.textColor || '#ffffff', goal: cat.goal || 0
            }])
            .select('*')
            .single();
        if (error) throw error;
        return { id: data.id, name: data.name, color: data.color, textColor: data.text_color, goal: parseFloat(data.goal) };
    },

    async updateCategory(catId, cat) {
        const { error } = await supabaseClient
            .from('categories')
            .update({ name: cat.name, color: cat.color, text_color: cat.textColor || '#ffffff', goal: cat.goal || 0 })
            .eq('id', catId);
        if (error) throw error;
    },

    async deleteCategory(catId) {
        const { error } = await supabaseClient.from('categories').delete().eq('id', catId);
        if (error) throw error;
    },

    // ================================================================
    // CREDIT EXPENSES
    // ================================================================

    async getCreditExpenses(userId) {
        const { data, error } = await supabaseClient
            .from('credit_expenses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at');
        if (error) throw error;
        return (data || []).map(e => ({
            id: e.id, name: e.name, amount: parseFloat(e.amount),
            date: e.date, categoryId: e.category_id,
            cycleStart: e.cycle_start, cycleEnd: e.cycle_end, dueDate: e.due_date
        }));
    },

    async createCreditExpense(userId, exp) {
        const { data, error } = await supabaseClient
            .from('credit_expenses')
            .insert([{
                user_id: userId, name: exp.name, amount: exp.amount, date: exp.date,
                category_id: exp.categoryId, cycle_start: exp.cycleStart,
                cycle_end: exp.cycleEnd, due_date: exp.dueDate
            }])
            .select('*')
            .single();
        if (error) throw error;
        return {
            id: data.id, name: data.name, amount: parseFloat(data.amount),
            date: data.date, categoryId: data.category_id,
            cycleStart: data.cycle_start, cycleEnd: data.cycle_end, dueDate: data.due_date
        };
    },

    async updateCreditExpense(expId, exp) {
        const { error } = await supabaseClient
            .from('credit_expenses')
            .update({
                name: exp.name, amount: exp.amount, date: exp.date,
                category_id: exp.categoryId, cycle_start: exp.cycleStart,
                cycle_end: exp.cycleEnd, due_date: exp.dueDate
            })
            .eq('id', expId);
        if (error) throw error;
    },

    async deleteCreditExpense(expId) {
        const { error } = await supabaseClient.from('credit_expenses').delete().eq('id', expId);
        if (error) throw error;
    },

    // ================================================================
    // DEBIT TRANSACTIONS
    // ================================================================

    async getDebitTransactions(userId) {
        const { data, error } = await supabaseClient
            .from('debit_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at');
        if (error) throw error;
        return (data || []).map(t => ({
            id: t.id, name: t.name, amount: parseFloat(t.amount),
            date: t.date, categoryId: t.category_id, type: t.type
        }));
    },

    async createDebitTransaction(userId, txn) {
        const { data, error } = await supabaseClient
            .from('debit_transactions')
            .insert([{
                user_id: userId, name: txn.name, amount: txn.amount,
                date: txn.date, category_id: txn.categoryId, type: txn.type
            }])
            .select('*')
            .single();
        if (error) throw error;
        return { id: data.id, name: data.name, amount: parseFloat(data.amount), date: data.date, categoryId: data.category_id, type: data.type };
    },

    async updateDebitTransaction(txnId, txn) {
        const { error } = await supabaseClient
            .from('debit_transactions')
            .update({ name: txn.name, amount: txn.amount, date: txn.date, category_id: txn.categoryId, type: txn.type })
            .eq('id', txnId);
        if (error) throw error;
    },

    async deleteDebitTransaction(txnId) {
        const { error } = await supabaseClient.from('debit_transactions').delete().eq('id', txnId);
        if (error) throw error;
    },

    // ================================================================
    // INSTALLMENTS
    // ================================================================

    async getInstallments(userId) {
        const { data, error } = await supabaseClient
            .from('installments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at');
        if (error) throw error;
        return (data || []).map(i => ({
            id: i.id, name: i.name, installmentAmount: parseFloat(i.installment_amount),
            totalInstallments: i.total_installments, currentInstallment: i.current_installment,
            date: i.date, categoryId: i.category_id
        }));
    },

    async createInstallment(userId, inst) {
        const { data, error } = await supabaseClient
            .from('installments')
            .insert([{
                user_id: userId, name: inst.name, installment_amount: inst.installmentAmount,
                total_installments: inst.totalInstallments, current_installment: inst.currentInstallment,
                date: inst.date, category_id: inst.categoryId
            }])
            .select('*')
            .single();
        if (error) throw error;
        return {
            id: data.id, name: data.name, installmentAmount: parseFloat(data.installment_amount),
            totalInstallments: data.total_installments, currentInstallment: data.current_installment,
            date: data.date, categoryId: data.category_id
        };
    },

    async updateInstallment(instId, inst) {
        const { error } = await supabaseClient
            .from('installments')
            .update({
                name: inst.name, installment_amount: inst.installmentAmount,
                total_installments: inst.totalInstallments, current_installment: inst.currentInstallment,
                date: inst.date, category_id: inst.categoryId
            })
            .eq('id', instId);
        if (error) throw error;
    },

    async deleteInstallment(instId) {
        const { error } = await supabaseClient.from('installments').delete().eq('id', instId);
        if (error) throw error;
    }
};
