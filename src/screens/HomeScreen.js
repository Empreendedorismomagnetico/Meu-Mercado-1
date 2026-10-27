
import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';

import Header from '../components/Header';
import ProductForm from '../components/ProductForm';
import ProductList from '../components/ProductList';
import TotalCard from '../components/TotalCard';

import {
  saveCurrentPurchase,
  getCurrentPurchase,
  finishPurchase,
} from '../storage/database';

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    async function loadProducts() {
      const saved = await getCurrentPurchase();
      setProducts(saved);
      setLoaded(true);
    }

    loadProducts();
  }, []);

  useEffect(() => {
    if (loaded) {
      saveCurrentPurchase(products);
    }
  }, [products, loaded]);

  const total = products.reduce((sum, item) => {
    return sum + Number(item.quantity) * Number(item.price);
  }, 0);

  function addProduct(product) {
    setProducts(current => [...current, product]);
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setEditName(product.name);
    setEditQuantity(String(product.quantity));
    setEditPrice(String(product.price).replace('.', ','));
  }

  function updateProduct() {
    const quantity = Number(editQuantity.replace(',', '.'));
    const price = Number(editPrice.replace(',', '.'));

    if (!editName.trim() || !Number.isFinite(quantity) ||
        !Number.isFinite(price) || quantity <= 0 || price < 0) {
      Alert.alert('Atenção', 'Confira o nome, a quantidade e o preço.');
      return;
    }

    setProducts(current =>
      current.map(item =>
        item.id === selectedProduct.id
          ? {
              ...item,
              name: editName.trim(),
              quantity,
              price,
            }
          : item
      )
    );

    setSelectedProduct(null);
  }

  function deleteProduct(id) {
    Alert.alert(
      'Excluir produto',
      'Deseja remover este produto da lista?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setProducts(current =>
              current.filter(item => item.id !== id)
            );
          },
        },
      ]
    );
  }

  async function finalizeList() {
    if (products.length === 0) {
      Alert.alert('Lista vazia', 'Adicione produtos antes de finalizar.');
      return;
    }

    Alert.alert(
      'Finalizar compra',
      'Deseja salvar esta compra no histórico?',
      [
        { text: 'Continuar comprando', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
            try {
              await finishPurchase(products);
              setProducts([]);
              Alert.alert('Compra salva!', 'Sua lista foi registrada no histórico.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível salvar a compra.');
            }
          },
        },
      ]
    );
  }

  if (!loaded) {
    return <View style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Header />

        <View style={styles.main}>
          <ProductForm onAddProduct={addProduct} />

          <TotalCard total={total} />

          {products.length > 0 && (
            <>
              <Text style={styles.listTitle}>
                Lista de compras
              </Text>

              <ProductList
                products={products}
                onProductPress={openProduct}
                onDeleteProduct={deleteProduct}
              />

              <TouchableOpacity
                style={styles.finishButton}
                onPress={finalizeList}
              >
                <Text style={styles.finishText}>
                  Finalizar lista
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Editar produto
            </Text>

            <Text style={styles.label}>Nome do produto</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.label}>Quantidade</Text>
            <TextInput
              style={styles.input}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Valor unitário (R$)</Text>
            <TextInput
              style={styles.input}
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="decimal-pad"
            />

            <Text style={styles.subtotal}>
              Subtotal: R$ {
                (
                  (Number(editQuantity.replace(',', '.')) || 0) *
                  (Number(editPrice.replace(',', '.')) || 0)
                ).toFixed(2).replace('.', ',')
              }
            </Text>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={updateProduct}
            >
              <Text style={styles.saveText}>Salvar alterações</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSelectedProduct(null)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  main: {
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111111',
    marginTop: 15,
    marginBottom: 5,
  },
  finishButton: {
    backgroundColor: '#111111',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 20,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  loading: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 18,
  },
  modalTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111111',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F3F3F3',
    padding: 13,
    borderRadius: 9,
    fontSize: 16,
  },
  subtotal: {
    fontSize: 19,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  saveButton: {
    backgroundColor: '#111111',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 13,
    alignItems: 'center',
  },
  cancelText: {
    color: '#555555',
  },
});
