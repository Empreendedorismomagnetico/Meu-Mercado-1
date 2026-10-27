
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';

import ProductItem from './ProductItem';

export default function ProductList({
  products,
  onProductPress,
  onDeleteProduct,
}) {
  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <Text style={styles.empty}>
          Sua lista está vazia.
        </Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductItem
              product={item}
              onPress={() => onProductPress(item)}
              onDelete={onDeleteProduct}
            />
          )}
          scrollEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 10,
  },
  empty: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 15,
    padding: 25,
  },
});
