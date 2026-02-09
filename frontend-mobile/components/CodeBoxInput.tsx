import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

interface CodeBoxInputProps {
  length: number;
  mode: 'numeric' | 'alpha' | 'alphanumeric';
  value: string;
  onChange: (value: string) => void;
}

const CodeBoxInput: React.FC<CodeBoxInputProps> = ({ length = 4, mode = 'alphanumeric', value, onChange }) => {
  const inputs = useRef<Array<TextInput | null>>([]);
  
  // Pad the value with spaces to match the length, so we can address each index
  const safeValue = (value || '').padEnd(length, ' ');

  const getChar = (index: number) => safeValue[index];

  const focusNext = (index: number) => {
    if (index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const focusPrev = (index: number) => {
    if (index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const validateChar = (char: string) => {
    if (!char) return true;
    if (mode === 'numeric') return /^\d$/.test(char);
    if (mode === 'alpha') return /^[a-zA-Z]$/.test(char);
    return /^[a-zA-Z0-9]$/.test(char); // alphanumeric
  };

  const updateValue = (index: number, char: string) => {
    const chars = safeValue.split('');
    chars[index] = char;
    // We join and take substring up to length just in case
    // We don't trim here because we need to preserve positions (e.g. "A C")
    // But the parent/submission might want to trim or validation might fail if there are spaces.
    // The requirement says "Combine all box values into a single string".
    // Usually "A B" is treated as "AB" or "A B". 
    // Given it's a code, "A B" implies missing 2nd char.
    // I will pass the string with spaces, parent can handle or we handle submission validation.
    const newValue = chars.join('').substring(0, length);
    onChange(newValue);
  };

  const handleTextChange = (text: string, index: number) => {
    if (text.length > 0) {
        // Take the last character typed (handles standard typing)
        // If paste happens and maxLength is ignored, we might get more.
        const char = text.slice(-1); 
        if (validateChar(char)) {
            updateValue(index, char);
            focusNext(index);
        }
    } else {
        // Cleared
        updateValue(index, ' ');
        // We don't auto focus prev on clear, user might just want to clear current.
        // Backspace key press handles navigation.
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
        // If current box is empty (space), move back
        if (getChar(index) === ' ') {
            focusPrev(index);
             // And we might want to clear the previous one too? 
             // Standard behavior: 
             // 1. "A|B" -> Backspace -> "A|" (clears B)
             // 2. "A|" (empty) -> Backspace -> "A" (focuses A)
             // 3. "A" (focused at end) -> Backspace -> "|" (clears A)
        } else {
             // It will be cleared by onChangeText
        }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => (
        <TextInput
          key={index}
          ref={ref => inputs.current[index] = ref}
          style={[
            styles.box, 
            getChar(index) !== ' ' ? styles.filled : null
          ]}
          // We display empty string if it's a space, so placeholder shows or just empty
          value={getChar(index) === ' ' ? '' : getChar(index)}
          onChangeText={(text) => handleTextChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType={mode === 'numeric' ? 'number-pad' : 'default'}
          maxLength={1}
          autoCapitalize="characters"
          selectTextOnFocus
          cursorColor='#d8b443'
          selectionColor='#fff5deff'
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 10,
    width: '100%',
  },
  box: {
    width: 45,
    height: 55,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    backgroundColor: '#f9f9f9',
    color: '#333',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  filled: {
    borderColor: '#d8b443',
    backgroundColor: '#fff',
    elevation: 4,
    shadowOpacity: 0.1,
  }
});

export default CodeBoxInput;
