
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

const today = new Date();

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function HistoryScreen() {
  const [purchases, setPurchases] = useState([]);

  const [filterMode, setFilterMode] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedWeekDate, setSelectedWeekDate] = useState(today);

  const [customStart, setCustomStart] = useState(startOfDay(today));
  const [customEnd, setCustomEnd] = useState(endOfDay(today));

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [location, setLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [dateSelectionTarget, setDateSelectionTarget] = useState('start');

  async function loadHistory() {
    try {
      const history = await getPurchaseHistory();
      setPurchases(Array.isArray(history) ? history : []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o histórico.');
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function formatTime(value) {
    return new Date(value).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  function changePeriod(direction) {
    if (filterMode === 'month') {
      setSelectedMonth(current =>
        new Date(
          current.getFullYear(),
          current.getMonth() + direction,
          1
        )
      );
    } else if (filterMode === 'week') {
      setSelectedWeekDate(current => addDays(current, direction * 7));
    }
  }

  function getPeriod() {
    if (filterMode === 'month') {
      return {
        start: new Date(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth(),
          1
        ),
        end: endOfDay(
          new Date(
            selectedMonth.getFullYear(),
            selectedMonth.getMonth() + 1,
            0
          )
        ),
      };
    }

    if (filterMode === 'week') {
      const date = startOfDay(selectedWeekDate);
      const monday = addDays(date, -((date.getDay() + 6) % 7));

      return {
        start: monday,
        end: endOfDay(addDays(monday, 6)),
      };
    }

    return {
      start: startOfDay(customStart),
      end: endOfDay(customEnd),
    };
  }

  const period = getPeriod();

  const filteredPurchases = purchases
    .filter(purchase => {
      const date = new Date(purchase.date);

      return (
        !Number.isNaN(date.getTime()) &&
        date >= period.start &&
        date <= period.end
      );
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalSpent = filteredPurchases.reduce(
    (sum, purchase) => sum + Number(purchase.total || 0),
    0
  );

  const totalDays = Math.max(
    1,
    Math.round(
      (startOfDay(period.end) - startOfDay(period.start)) /
      (1000 * 60 * 60 * 24)
    ) + 1
  );

  const averagePerDay = totalSpent / totalDays;

  const largestPurchase = filteredPurchases.reduce(
    (largest, purchase) =>
      Number(purchase.total || 0) > Number(largest?.total || 0)
        ? purchase
        : largest,
    null
  );

  const monthName = selectedMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  function getPeriodLabel() {
    if (filterMode === 'month') {
      return monthName;
    }

    if (filterMode === 'week') {
      return `${formatDate(period.start)} a ${formatDate(period.end)}`;
    }

    return `${formatDate(customStart)} a ${formatDate(customEnd)}`;
  }

  function openDatePicker(target = 'start') {
    setDateSelectionTarget(target);

    const referenceDate = target === 'end' ? customEnd : customStart;

    setCalendarMonth(
      new Date(
        referenceDate.getFullYear(),
        referenceDate.getMonth(),
        1
      )
    );

    setCalendarVisible(true);
  }

  function selectCalendarDate(day) {
    const selectedDate = startOfDay(
      new Date(
        calendarMonth.getFullYear(),
        calendarMonth.getMonth(),
        day
      )
    );

    if (dateSelectionTarget === 'start') {
      setCustomStart(selectedDate);

      if (selectedDate > customEnd) {
        setCustomEnd(endOfDay(selectedDate));
      }

      setDateSelectionTarget('end');
      return;
    }

    if (selectedDate < customStart) {
      setCustomStart(selectedDate);
      setCustomEnd(endOfDay(customStart));
    } else {
      setCustomEnd(endOfDay(selectedDate));
    }

    setFilterMode('custom');
    setCalendarVisible(false);
  }

  function selectQuickPeriod(days) {
    const end = endOfDay(today);
    const start = startOfDay(addDays(today, -(days - 1)));

    setCustomStart(start);
    setCustomEnd(end);
    setFilterMode('custom');
  }

  function selectCustomPeriod() {
    setFilterMode('custom');
    openDatePicker('start');
  }

  const calendarFirstDay = (
    new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    ).getDay() + 6
  ) % 7;

  const calendarDays = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth() + 1,
    0
  ).getDate();

  const calendarMonthName = calendarMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  function renderPurchase(purchase) {
    const productCount = (purchase.products || []).reduce(
      (sum, product) => sum + Number(product.quantity || 0),
      0
    );

    return (
      <TouchableOpacity
        key={purchase.id}
        style={styles.purchaseCard}
        onPress={() => openPurchase(purchase)}
        activeOpacity={0.75}
      >
        <View style={styles.purchaseIcon}>
          <Text style={styles.bagIcon}>▢</Text>
        </View>

        <View style={styles.purchaseInfo}>
          <Text style={styles.purchaseName}>
            Compra de {formatDate(purchase.date)}
          </Text>

          <Text style={styles.purchaseDetails}>
            {new Date(purchase.date).toLocaleDateString('pt-BR', {
              weekday: 'long',
            })} · {formatTime(purchase.date)} · {productCount} produtos
          </Text>

          {purchase.location ? (
            <Text style={styles.purchaseLocation}>
              {purchase.location}
            </Text>
          ) : null}
        </View>

        <View style={styles.purchaseRight}>
          <Text style={styles.purchaseTotal}>
            R$ {formatMoney(purchase.total)}
          </Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerIcon}>▥</Text>

          <View style={styles.headerText}>
            <Text style={styles.title}>Controle de gastos</Text>
            <Text style={styles.subtitle}>
              Veja quanto você gastou no mercado e filtre por período.
            </Text>
          </View>
        </View>

        <View style={styles.filterTabs}>
          {[
            { key: 'month', label: 'Mês' },
            { key: 'week', label: 'Semana' },
            { key: 'custom', label: 'Período' },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterTab,
                filterMode === option.key && styles.filterTabActive,
              ]}
              onPress={() => {
                if (option.key === 'custom') {
                  selectCustomPeriod();
                } else {
                  setFilterMode(option.key);
                }
              }}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterMode === option.key && styles.filterTabTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.periodSelector}>
          {filterMode !== 'custom' && (
            <TouchableOpacity
              style={styles.periodArrow}
              onPress={() => changePeriod(-1)}
            >
              <Text style={styles.periodArrowText}>‹</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.periodDate}
            onPress={() => {
              if (filterMode === 'custom') {
                openDatePicker('start');
              }
            }}
            activeOpacity={filterMode === 'custom' ? 0.7 : 1}
          >
            <Text style={styles.calendarIcon}>▦</Text>
            <Text style={styles.periodDateText}>
              {getPeriodLabel()}
            </Text>
          </TouchableOpacity>

          {filterMode === 'custom' ? (
            <TouchableOpacity
              style={styles.periodArrow}
              onPress={() => openDatePicker('end')}
            >
              <Text style={styles.periodArrowText}>⌄</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.periodArrow}
              onPress={() => changePeriod(1)}
            >
              <Text style={styles.periodArrowText}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {filterMode === 'custom' && (
          <View style={styles.customDates}>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => openDatePicker('start')}
            >
              <Text style={styles.dateFieldLabel}>Data inicial</Text>
              <Text style={styles.dateFieldValue}>
                {formatDate(customStart)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateField}
              onPress={() => openDatePicker('end')}
            >
              <Text style={styles.dateFieldLabel}>Data final</Text>
              <Text style={styles.dateFieldValue}>
                {formatDate(customEnd)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            TOTAL GASTO NO PERÍODO
          </Text>

          <Text style={styles.totalValue}>
            R$ {formatMoney(totalSpent)}
          </Text>

          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>
              ✓ Período selecionado
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🛒</Text>
            <Text style={styles.statLabel}>COMPRAS REALIZADAS</Text>
            <Text style={styles.statValue}>
              {filteredPurchases.length}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>▦</Text>
            <Text style={styles.statLabel}>MÉDIA POR DIA</Text>
            <Text style={styles.statValueSmall}>
              R$ {formatMoney(averagePerDay)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>▤</Text>
            <Text style={styles.statLabel}>MAIOR GASTO</Text>
            <Text style={styles.statValueSmall}>
              R$ {formatMoney(largestPurchase?.total || 0)}
            </Text>
          </View>
        </View>

        <View style={styles.quickFilters}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => selectQuickPeriod(7)}
          >
            <Text style={styles.quickButtonText}>▦  Últimos 7 dias</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => selectQuickPeriod(30)}
          >
            <Text style={styles.quickButtonText}>▦  Últimos 30 dias</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickButton,
              filterMode === 'custom' && styles.quickButtonActive,
            ]}
            onPress={selectCustomPeriod}
          >
            <Text
              style={[
                styles.quickButtonText,
                filterMode === 'custom' && styles.quickButtonTextActive,
              ]}
            >
              ▦  Personalizado
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Compras no período <Text style={styles.listCount}>
              ({filteredPurchases.length})
            </Text>
          </Text>

          <Text style={styles.sortLabel}>Mais recentes</Text>
        </View>

        {filteredPurchases.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Nenhuma compra neste período.
            </Text>
            <Text style={styles.emptyHint}>
              Experimente selecionar outras datas.
            </Text>
          </View>
        ) : (
          filteredPurchases.map(renderPurchase)
        )}

        <Text style={styles.disclaimer}>
          ⓘ  Os valores são calculados com base nas compras finalizadas e salvas no histórico.
        </Text>
      </ScrollView>

      {/* Calendário para selecionar as datas */}

      <Modal
        visible={calendarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.calendarModal}>
            <Text style={styles.calendarModalTitle}>
              Selecionar período
            </Text>

            <Text style={styles.calendarModalHint}>
              {dateSelectionTarget === 'start'
                ? 'Escolha a data inicial'
                : 'Agora escolha a data final'}
            </Text>

            <View style={styles.calendarMonthHeader}>
              <TouchableOpacity
                onPress={() => {
                  setCalendarMonth(current =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() - 1,
                      1
                    )
                  );
                }}
              >
                <Text style={styles.calendarArrow}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.calendarMonthTitle}>
                {calendarMonthName}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setCalendarMonth(current =>
                    new Date(
                      current.getFullYear(),
                      current.getMonth() + 1,
                      1
                    )
                  );
                }}
              >
                <Text style={styles.calendarArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, index) => (
                <View key={index} style={styles.calendarDayCell}>
                  <Text style={styles.calendarWeekday}>{day}</Text>
                </View>
              ))}

              {Array.from({ length: calendarFirstDay }).map((_, index) => (
                <View
                  key={`empty-${index}`}
                  style={styles.calendarDayCell}
                />
              ))}

              {Array.from({ length: calendarDays }).map((_, index) => {
                const day = index + 1;
                const date = new Date(
                  calendarMonth.getFullYear(),
                  calendarMonth.getMonth(),
                  day
                );

                const isStart = dateKey(date) === dateKey(customStart);
                const isEnd = dateKey(date) === dateKey(customEnd);

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.calendarDayCell,
                      (isStart || isEnd) && styles.calendarDaySelected,
                    ]}
                    onPress={() => selectCalendarDate(day)}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        (isStart || isEnd) && styles.calendarDayTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.calendarCancel}
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.calendarCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detalhes da compra */}

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

                  {(selectedPurchase.products || []).map((product, index) => (
                    <View
 
