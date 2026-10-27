
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function ProductForm({ onAddProduct }) {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');

  function addProduct() {
    if (!name.trim()) return;

    onAddProduct({
      id: Date.now().toString(),
      name: name.trim(),
      quantity: 1,
      price: 0,
    });

    setName('');
    setVisible(false);
  }

  return (
    <View style={styles.container}>
      {!visible ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setVisible(true)}
        >
          <Text style={styles.addText}>＋</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>Novo produto</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome do produto"
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <View style={styles.buttons}>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.cancelButton}
            >
              <Text>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={addProduct}
              style={styles.saveButton}
            >
              <Text style={styles.saveText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 15,
  },
  addButton: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 38,
    color: '#FFFFFF',
    marginTop: -4,
  },
  form: {
    width: '100%',
    padding: 18,
    backgroundColor: '#F4F4F4',
    borderRadius: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  cancelButton: {
    padding: 12,
  },
  saveButton: {
    backgroundColor: '#111111',
    padding: 12,
    borderRadius: 8,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
