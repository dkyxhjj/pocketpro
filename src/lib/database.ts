import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js';

// Game Ledger Types
export interface Player {
  id: string;
  name: string;
  buyIns: number[];
  totalBuyIn: number;
  isActive: boolean;
  cashout?: number;
}

export interface Game {
  id?: string;
  user_id: string;
  total_money_in_play: number;
  players: Player[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Income Tracker Types
export interface PokerSession {
  id: string;
  date: string;
  hours: number;
  profit: number;
  notes?: string;
}

export interface DbPokerSession {
  id?: string;
  user_id: string;
  date: string;
  hours: number;
  profit: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Replace all usage of 'supabase' with a single client instance
const supabase = createClient()

// Get current user
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Game Ledger Operations
export const saveGame = async (players: Player[], totalMoneyInPlay: number): Promise<string | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  // Check if we're updating an existing game or creating a new one
  const { data: existingGame } = await supabase
    .from('games')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (existingGame) {
    // Update existing game
    const { error } = await supabase
      .from('games')
      .update({
        players,
        total_money_in_play: totalMoneyInPlay,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingGame.id);
    
    if (error) {
      console.error('Error updating game:', error);
      return null;
    }
    
    return existingGame.id;
  } else {
    // Create new game
    const { data, error } = await supabase
      .from('games')
      .insert({
        user_id: user.id,
        players,
        total_money_in_play: totalMoneyInPlay,
        is_active: true
      })
      .select();
    
    if (error) {
      console.error('Error creating game:', error);
      return null;
    }
    
    return data?.[0]?.id || null;
  }
};

export const fetchGame = async (): Promise<Game | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  // Try to get active game first
  let { data: game } = await supabase
    .from('games')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // If no active game, get the most recent one
  if (!game) {
    const { data: recentGame } = await supabase
      .from('games')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    game = recentGame;
  }

  return game;
};

export const endGame = async (gameId: string): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;

  const { error } = await supabase
    .from('games')
    .update({ is_active: false })
    .eq('id', gameId)
    .eq('user_id', user.id);

  return !error;
};

// Income Tracker Operations
export const saveSessions = async (sessions: PokerSession[]): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;

  // First, delete all existing sessions for this user
  const { error: deleteError } = await supabase
    .from('sessions')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error deleting sessions:', deleteError);
    return false;
  }

  // Then insert all current sessions
  if (sessions.length === 0) return true;

  const dbSessions: DbPokerSession[] = sessions.map(session => ({
    user_id: user.id,
    date: session.date,
    hours: session.hours,
    profit: session.profit,
    notes: session.notes
  }));

  const { error: insertError } = await supabase
    .from('sessions')
    .insert(dbSessions);

  if (insertError) {
    console.error('Error saving sessions:', insertError);
    return false;
  }

  return true;
};

export const fetchSessions = async (): Promise<PokerSession[]> => {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return data.map(session => ({
    id: session.id,
    date: session.date,
    hours: session.hours,
    profit: session.profit,
    notes: session.notes
  }));
};

export const saveSession = async (session: Omit<PokerSession, 'id'>): Promise<string | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      date: session.date,
      hours: session.hours,
      profit: session.profit,
      notes: session.notes
    })
    .select();
  
  if (error) {
    console.error('Error saving session:', error);
    return null;
  }
  
  return data?.[0]?.id || null;
};

export const updateSession = async (id: string, session: Partial<PokerSession>): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;

  const { error } = await supabase
    .from('sessions')
    .update({
      date: session.date,
      hours: session.hours,
      profit: session.profit,
      notes: session.notes
    })
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
};

export const deleteSession = async (id: string): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return !error;
};
