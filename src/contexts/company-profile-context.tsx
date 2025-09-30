'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useReducer } from 'react';
import type { CompanyProfile, Signatory, BankAccount } from '@/lib/types';

type State = CompanyProfile;

type Action =
  | { type: 'SET_PROFILE'; payload: CompanyProfile }
  | { type: 'UPDATE_FIELD'; payload: { field: keyof CompanyProfile; value: any } }
  | { type: 'ADD_SIGNATORY'; payload: Signatory }
  | { type: 'UPDATE_SIGNATORY'; payload: Signatory }
  | { type: 'REMOVE_SIGNATORY'; payload: string }
  | { type: 'ADD_BANK_ACCOUNT'; payload: BankAccount }
  | { type: 'UPDATE_BANK_ACCOUNT'; payload: BankAccount }
  | { type: 'REMOVE_BANK_ACCOUNT'; payload: string };

const initialState: State = {
  name: 'Your Company',
  address: '123 Business Rd, Suite 100, City, State 12345',
  tin: '12345678-0001',
  email: 'contact@yourcompany.com',
  phone: '(123) 456-7890',
  website: 'www.yourcompany.com',
  logoUrl: '/placeholder-logo.png',
  signatories: [],
  bankAccounts: [],
};

const CompanyProfileContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

function companyProfileReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_PROFILE':
      return action.payload;
    case 'UPDATE_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'ADD_SIGNATORY':
      return { ...state, signatories: [...state.signatories, action.payload] };
    case 'UPDATE_SIGNATORY':
      return {
        ...state,
        signatories: state.signatories.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'REMOVE_SIGNATORY':
      return {
        ...state,
        signatories: state.signatories.filter((s) => s.id !== action.payload),
      };
    case 'ADD_BANK_ACCOUNT':
      return { ...state, bankAccounts: [...state.bankAccounts, action.payload] };
    case 'UPDATE_BANK_ACCOUNT':
      return {
        ...state,
        bankAccounts: state.bankAccounts.map((b) =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'REMOVE_BANK_ACCOUNT':
      return {
        ...state,
        bankAccounts: state.bankAccounts.filter(
          (b) => b.id !== action.payload
        ),
      };
    default:
      return state;
  }
}

const LOCAL_STORAGE_KEY = 'docupro_company_profile';

export function CompanyProfileProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(companyProfileReducer, initialState);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        dispatch({ type: 'SET_PROFILE', payload: JSON.parse(storedState) });
      }
    } catch (error) {
      console.error('Failed to read from localStorage', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to write to localStorage', error);
    }
  }, [state]);

  return (
    <CompanyProfileContext.Provider value={{ state, dispatch }}>
      {children}
    </CompanyProfileContext.Provider>
  );
}

export function useCompanyProfile() {
  const context = useContext(CompanyProfileContext);
  if (!context) {
    throw new Error('useCompanyProfile must be used within a CompanyProfileProvider');
  }
  return context;
}
