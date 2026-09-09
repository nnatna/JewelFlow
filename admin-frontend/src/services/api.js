import axios from 'axios';
import {
  initialProducts,
  initialGoldRates,
  initialCategories,
  initialMetalTypes,
  initialGemstones,
  initialCustomers,
  initialSales,
  initialBuybacks,
  initialSuppliers
} from '../types/mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Helper for local storage persistent state
const loadFromStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(`jewelflow_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return fallback;
  }
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(`jewelflow_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing ${key} to storage:`, e);
  }
};

export const apiService = {
  // Products
  getProducts: async () => {
    try {
      const res = await client.get('/products');
      return res.data;
    } catch {
      return loadFromStorage('products', initialProducts);
    }
  },
  saveProducts: (products) => saveToStorage('products', products),

  // Gold Rates
  getGoldRates: async () => {
    try {
      const res = await client.get('/gold-rates');
      return res.data;
    } catch {
      return loadFromStorage('goldRates', initialGoldRates);
    }
  },
  saveGoldRates: (rates) => saveToStorage('goldRates', rates),

  // Sales
  getSales: async () => {
    try {
      const res = await client.get('/sales');
      return res.data;
    } catch {
      return loadFromStorage('sales', initialSales);
    }
  },
  saveSales: (sales) => saveToStorage('sales', sales),

  // Buybacks
  getBuybacks: async () => {
    try {
      const res = await client.get('/buybacks');
      return res.data;
    } catch {
      return loadFromStorage('buybacks', initialBuybacks);
    }
  },
  saveBuybacks: (buybacks) => saveToStorage('buybacks', buybacks),

  // Customers
  getCustomers: async () => {
    try {
      const res = await client.get('/customers');
      return res.data;
    } catch {
      return loadFromStorage('customers', initialCustomers);
    }
  },
  saveCustomers: (customers) => saveToStorage('customers', customers),

  // Categories & Metals & Gemstones
  getCategories: () => initialCategories,
  getMetalTypes: () => initialMetalTypes,
  getGemstones: () => initialGemstones,
  getSuppliers: () => initialSuppliers,
};

export default apiService;
