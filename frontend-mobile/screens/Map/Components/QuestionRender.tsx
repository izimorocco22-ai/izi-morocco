import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CustomInput from '../../../components/CustomInput';
import CodeBoxInput from '../../../components/CodeBoxInput';
import CaptureMedia from '../../../components/CaptureMedia';
import colors from '../../../styles/colors';
import commonStyles from '../../../styles/commonStyles';

const QuestionRenderer = ({
  question,
  selectedOption,
  setSelectedOption,
  inputAnswer,
  setInputAnswer,
}) => {
  const handleOptionPress = (index: number) => {
    if (question.answerType === 'mcq') {
      setSelectedOption([index]); // Only one selection
    } else if (question.answerType === 'multiple') {
      const updated = selectedOption.includes(index)
        ? selectedOption.filter(i => i !== index)
        : [...selectedOption, index];
      setSelectedOption(updated);
    }
  };

  return (
    <View style={styles.container}>
      {/* For MCQ / MSQ */}
      {(question.answerType === 'mcq' || question.answerType === 'multiple') &&
        question.options?.map((option, index) => {
          const isSelected = selectedOption.includes(index);
          return (
            <TouchableOpacity
              key={option._id}
              style={[styles.option, isSelected && styles.selectedOption]}
              onPress={() => handleOptionPress(index)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? '#d8b443' : '#000' },
                  isSelected && styles.selectedText,
                ]}
              >
                {option.text}
              </Text>
            </TouchableOpacity>
          );
        })}

      {/* For TEXT INPUT */}
      {question.answerType === 'text' && (
        <CustomInput
          error={null}
          placeholder="Type your answer"
          value={inputAnswer}
          onChangeText={setInputAnswer}
        />
      )}

      {/* For NUMBER INPUT */}
      {question.answerType === 'number' && (
        <CustomInput
          error={null}
          placeholder="Enter a number"
          keyboardType="numeric"
          value={inputAnswer}
          onChangeText={setInputAnswer}
        />
      )}

      {/* For PUZZLE INPUT */}
      {question.answerType === 'puzzle' && (
        <CustomInput
          error={null}
          placeholder="Enter the puzzle answer"
          value={inputAnswer}
          onChangeText={setInputAnswer}
        />
      )}

      {/* For CODE BOX */}
      {question.answerType === 'code_box' && (
        <CodeBoxInput
          length={question.codeBoxConfig?.length || 4}
          mode={question.codeBoxConfig?.mode || 'alphanumeric'}
          value={inputAnswer}
          onChange={setInputAnswer}
        />
      )}

      {/* For PHOTO CAPTURE */}
      {question.answerType === 'take_photo' && (
        <CaptureMedia
          type="photo"
          value={inputAnswer}
          onChange={setInputAnswer}
        />
      )}

      {/* For AUGMENTED PHOTO */}
      {question.answerType === 'augmented_photo' && (
        <CaptureMedia
          type="augmented_photo"
          value={inputAnswer}
          onChange={setInputAnswer}
        />
      )}

      {/* For VIDEO RECORDING */}
      {question.answerType === 'record_video' && (
        <CaptureMedia
          type="video"
          value={inputAnswer}
          onChange={setInputAnswer}
        />
      )}

      {/* For NO ANSWER */}
      {/* {question.answerType === 'no_answer' && (
        <Text style={[commonStyles.pText]}>
          No answer required for this question.
        </Text>
      )} */}
    </View>
  );
};

export default QuestionRenderer;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  option: {
    borderWidth: 1,
    borderColor: '#deca88',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#fff5deff',
    borderColor: '#d8b443',
    elevation: 5,
    shadowColor: '#deca88',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  optionText: {
    fontSize: 16,
    color: '#000', // Default text color
  },
  selectedText: {
    fontWeight: '600',
  },
});
