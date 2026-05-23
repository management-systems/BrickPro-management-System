import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { getColors } from '../lib/theme';
import { useAppStore } from '../store/app';
import api from '../lib/api';

interface EditField {
  key: string;
  label: string;
  value: string;
  type?: 'text' | 'number';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  module: 'production' | 'dispatch' | 'expenditure' | 'fuel';
  recordId: string;
  fields: EditField[];
  title?: string;
}

export default function EditModal({ visible, onClose, onSuccess, module, recordId, fields, title }: Props) {
  const { theme } = useAppStore();
  const colors = getColors(theme);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    fields.forEach(f => { v[f.key] = f.value; });
    return v;
  });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!reason.trim()) { Alert.alert('Reason required', 'Please enter why you are editing this entry'); return; }

    const updates: any = { reason };
    fields.forEach(f => {
      if (values[f.key] !== f.value) {
        updates[f.key] = f.type === 'number' ? +values[f.key] : values[f.key];
      }
    });

    if (Object.keys(updates).length <= 1) { Alert.alert('No changes', 'Nothing was changed'); return; }

    setLoading(true);
    try {
      await api.patch(`/edit/${module}/${recordId}`, updates);
      Alert.alert('✓ Updated', 'Entry has been edited successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Edit Failed', err.response?.data?.error || 'Could not edit this entry');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>✏️ {title || 'Edit Entry'}</Text>
              <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 18, color: colors.danger }}>✕</Text></TouchableOpacity>
            </View>

            {fields.map(f => (
              <View key={f.key} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 12, color: colors.textLight, marginBottom: 4 }}>{f.label}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.bg, color: colors.text }]}
                  value={values[f.key]}
                  onChangeText={v => setValues({ ...values, [f.key]: v })}
                  keyboardType={f.type === 'number' ? 'numeric' : 'default'}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: colors.danger, marginBottom: 4, fontWeight: '600' }}>Reason for edit *</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.danger, backgroundColor: colors.bg, color: colors.text, minHeight: 60 }]}
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Typing mistake, wrong quantity..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={onClose} style={[styles.btn, { backgroundColor: colors.bg, flex: 1 }]}>
                <Text style={{ color: colors.textLight, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.btn, { backgroundColor: colors.primary, flex: 2, opacity: loading ? 0.6 : 1 }]}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{loading ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  btn: { padding: 14, borderRadius: 12, alignItems: 'center' },
});
