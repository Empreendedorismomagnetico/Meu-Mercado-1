import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';

import {
  getPurchaseHistory,
  updatePurchaseDetails,
} from '../storage/database';

export default function HistoryScreen() {
  const [purchases, setPurchases] = useState([]);
  const [mode, setMode] = useState('list');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [location, setLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [month, setMonth] = useState(new Date());

  async function loadHistory() {
    try {
      const history = await getPurchaseHistory();
      setPurchases(history);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o histórico.');
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function formatDate(value) {
    return new Date(value).toLocaleDateString('pt-BR');
  }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatMoney(value) {
    return Number(value || 0).toFixed(2).replace('.', ',');
  }

  function openPurchase(purchase) {
    setSelectedPurchase(purchase);
    setLocation(purchase.location || '');
    setPaymentMethod(purchase.paymentMethod || '');
    setNotes(purchase.notes || '');
  }

  async function saveDetails() {
    if (!selectedPurchase) return;

    try {
      await updatePurchaseDetails(selectedPurchase.id, {
        location,
        paymentMethod,
        notes,
      });

      setSelectedPurchase(null);
      await loadHistory();

      Alert.alert('Salvo!', 'Informações atualizadas com sucesso.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as informações.');
    }
  }

  function changeMonth(direction) {
    setMonth(current =>
      new Date(
        current.getFullYear(),
        current.getMonth() + direction,
        1
      )
    );

    setSelectedDay(null);
  }

  function openCalendarDay(day) {
    const dayPurchases = purchases.filter(purchase => {
      const date = new Date(purchase.date);

      return (
        date.getDate() === day &&
        date.getMonth() === month.getMonth() &&
        date.getFullYear() === month.getFullYear()
      );
    });

    setSelectedDay(dayPurchases.length > 0 ? day : null);
  }

  const firstDay = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  ).getDay();

  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();

  const monthName = month.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  const selectedDayPurchases = selectedDay
    ? purchases
        .filter(purchase => {
          const date = new Date(purchase.date);

          return (
            date.getDate() === selectedDay &&
            date.getMonth() === month.getMonth() &&
            date.getFullYear() === month.getFullYear()
          );
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    : [];

  function renderPurchase(purchase) {
    return (
      <TouchableOpacity
        key={purchase.id}
        style={styles.purchase}
        onPress={() => openPurchase(purchase)}
      >
        <View style={styles.purchaseInfo}>
          <Text style={styles.date}>
            {formatDate(purchase.date)}
          </Text>

          <Text style={styles.time}>
            {formatTime(purchase.date)}
            {purchase.location ? ` · ${purchase.location}` : ''}
          </Text>

          <Text style={styles.extra}>
            {purchase.paymentMethod || 'Adicionar forma de pagamento'}
          </Text>
        </View>

        <Text style={styles.total}>
          R$ {formatMoney(purchase.total)}
        </Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico</Text>
        <Text style={styles.subtitle}>
          Suas compras registradas
        </Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'list' && styles.activeTab]}
          onPress={() => setMode('list')}
        >
          <Text style={[styles.tabText, mode === 'list' && styles.activeText]}>
            Lista
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, mode === 'calendar' && styles.activeTab]}
          onPress={() => setMode('calendar')}
        >
          <Text style={[styles.tabText, mode === 'calendar' && styles.activeText]}>
            Calendário
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'list' ? (
        <ScrollView style={styles.scroll}>
          {purchases.length === 0 ? (
            <Text style={styles.empty}>
              Nenhuma compra registrada ainda.
            </Text>
          ) : (
            purchases.map(renderPurchase)
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll}>
          <View style={styles.calendar}>
            <View style={styles.monthHeader}>
              <TouchableOpacity onPress={() => changeMonth(-1)}>
                <Text style={styles.arrow}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.monthTitle}>{monthName}</Text>

              <TouchableOpacity onPress={() => changeMonth(1)}>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.grid}>
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                <View key={index} style={styles.dayCell}>
                  <Text style={styles.weekDay}>{day}</Text>
                </View>
              ))}

              {Array.from({ length: firstDay }).map((_, index) => (
                <View
                  key={`empty-${index}`}
                  style={styles.dayCell}
                />
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;

                const hasPurchase = purchases.some(purchase => {
                  const date = new Date(purchase.date);

                  return (
                    date.getDate() === day &&
                    date.getMonth() === month.getMonth() &&
                    date.getFullYear() === month.getFullYear()
                  );
                });

                const isSelected = selectedDay === day;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayCell,
                      hasPurchase && styles.purchaseDay,
                      isSelected && styles.selectedDay,
                    ]}
                    onPress={() => openCalendarDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        hasPurchase && styles.purchaseDayText,
                        isSelected && styles.selectedDayText,
                      ]}
                    >
                      {day}
                    </Text>

                    {hasPurchase && (
                      <View
                        style={[
                          styles.dot,
                          isSelected && styles.selectedDot,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.calendarHint}>
              Toque em um dia marcado para consultar suas compras.
            </Text>

            {selectedDay !== null && (
              <View style={styles.dayPurchases}>
                <Text style={styles.sectionTitle}>
                  Compras do dia {String(selectedDay).padStart(2, '0')}/
                  {String(month.getMonth() + 1).padStart(2, '0')}/
                  {month.getFullYear()}
                </Text>

                {selectedDayPurchases.map(purchase => (
                  <TouchableOpacity
                    key={purchase.id}
                    style={styles.dayPurchase}
                    onPress={() => openPurchase(purchase)}
                  >
                    <View style={styles.purchaseInfo}>
                      <Text style={styles.date}>
                        Compra às {formatTime(purchase.date)}
                      </Text>

                      <Text style={styles.extra}>
                        {purchase.location || 'Local não informado'}
                      </Text>
                    </View>

                    <Text style={styles.total}>
                      R$ {formatMoney(purchase.total)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
      <Modal
        visible={!!selectedPurchase}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPurchase(null)}
      >
        <View style={styles.modalBackground}>
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>
                Detalhes da compra
              </Text>

              {selectedPurchase && (
                <>
                  <Text style={styles.modalTotal}>
                    R$ {formatMoney(selectedPurchase.total)}
                  </Text>

                  <Text style={styles.modalDate}>
                    {formatDate(selectedPurchase.date)} às {formatTime(selectedPurchase.date)}
                  </Text>

                  <Text style={styles.sectionTitle}>Produtos</Text>

                  {selectedPurchase.products.map((product, index) => (
                    <View
                      key={product.id || `${product.name}-${index}`}
                      style={styles.productRow}
                    >
                      <Text style={styles.productName}>
                        {product.name} ({product.quantity}x)
                      </Text>

                      <Text style={styles.productPrice}>
                        R$ {formatMoney(product.quantity * product.price)}
                      </Text>
                    </View>
                  ))}

                  <Text style={styles.sectionTitle}>
                    Informações adicionais
                  </Text>

                  <Text style={styles.label}>Local da compra</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome do mercado ou estabelecimento"
                    value={location}
                    onChangeText={setLocation}
                  />

                  <Text style={styles.label}>Forma de pagamento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Pix, dinheiro, crédito..."
                    value={paymentMethod}
                    onChangeText={setPaymentMethod}
                  />

                  <Text style={styles.label}>Observações</Text>
                  <TextInput
                    style={[styles.input, styles.notes]}
                    placeholder="Escreva suas observações..."
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                  />

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveDetails}
                  >
                    <Text style={styles.saveText}>
                      Salvar informações
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setSelectedPurchase(null)}
                  >
                    <Text style={styles.closeText}>Fechar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
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
  header: {
    padding: 22,
  },
  title: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#111111',
  },
  subtitle: {
    color: '#888888',
    marginTop: 5,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F1F1F1',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 13,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#111111',
  },
  tabText: {
    color: '#555555',
    fontWeight: '600',
  },
  activeText: {
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    color: '#888888',
    padding: 25,
  },
  purchase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  purchaseInfo: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
  },
  time: {
    color: '#777777',
    marginTop: 5,
  },
  extra: {
    color: '#999999',
    fontSize: 12,
    marginTop: 5,
  },
  total: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111111',
  },
  calendar: {
    padding: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  arrow: {
    fontSize: 32,
    color: '#111111',
    paddingHorizontal: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.2857%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDay: {
    color: '#888888',
    fontWeight: 'bold',
  },
  dayText: {
    color: '#222222',
    fontSize: 15,
  },
  purchaseDay: {
    backgroundColor: '#EEEEEE',
    borderRadius: 10,
  },
  purchaseDayText: {
    color: '#111111',
    fontWeight: 'bold',
  },
  selectedDay: {
    backgroundColor: '#111111',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#111111',
    marginTop: 2,
  },
  selectedDot: {
    backgroundColor: '#FFFFFF',
  },
  calendarHint: {
    textAlign: 'center',
    color: '#888888',
    marginTop: 20,
    fontSize: 12,
  },
  dayPurchases: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  dayPurchase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 15,
  },
  modalContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 18,
  },
  modalTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#111111',
  },
  modalTotal: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 12,
  },
  modalDate: {
    color: '#888888',
    marginTop: 5,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  productName: {
    color: '#333333',
    flex: 1,
  },
  productPrice: {
    fontWeight: '600',
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F3F3F3',
    padding: 13,
    borderRadius: 9,
    fontSize: 15,
  },
  notes: {
    minHeight: 85,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 22,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 14,
    alignItems: 'center',
  },
  closeText: {
    color: '#666666',
  },
});
