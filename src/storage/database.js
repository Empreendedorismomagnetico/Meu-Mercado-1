
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_PURCHASE = '@meu_mercado:current';
const PURCHASE_HISTORY = '@meu_mercado:history';

// Salvar lista atual
export async function saveCurrentPurchase(products) {
  try {
    await AsyncStorage.setItem(
      CURRENT_PURCHASE,
      JSON.stringify(products)
    );
  } catch (error) {
    console.error('Erro ao salvar lista:', error);
  }
}

// Recuperar lista atual
export async function getCurrentPurchase() {
  try {
    const data = await AsyncStorage.getItem(CURRENT_PURCHASE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao recuperar lista:', error);
    return [];
  }
}

// Finalizar e registrar compra
export async function finishPurchase(products) {
  try {
    const history = await getPurchaseHistory();

    const total = products.reduce(
      (sum, product) =>
        sum + Number(product.quantity) * Number(product.price),
      0
    );

    const purchase = {
      id: Date.now().toString(),
      products,
      total,
      date: new Date().toISOString(),
      location: '',
      paymentMethod: '',
      notes: '',
    };

    await AsyncStorage.setItem(
      PURCHASE_HISTORY,
      JSON.stringify([purchase, ...history])
    );

    await AsyncStorage.removeItem(CURRENT_PURCHASE);

    return purchase;
  } catch (error) {
    console.error('Erro ao finalizar compra:', error);
    throw error;
  }
}

// Consultar histórico
export async function getPurchaseHistory() {
  try {
    const data = await AsyncStorage.getItem(PURCHASE_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erro ao consultar histórico:', error);
    return [];
  }
}

// Atualizar informações adicionais
export async function updatePurchaseDetails(id, details) {
  try {
    const history = await getPurchaseHistory();

    const updatedHistory = history.map((purchase) =>
      purchase.id === id
        ? { ...purchase, ...details }
        : purchase
    );

    await AsyncStorage.setItem(
      PURCHASE_HISTORY,
      JSON.stringify(updatedHistory)
    );

    return updatedHistory;
  } catch (error) {
    console.error('Erro ao atualizar compra:', error);
    throw error;
  }
}
