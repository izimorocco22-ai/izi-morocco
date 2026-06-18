import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

type Props = {
  children: React.ReactNode;
  backgroundColor?: string;
};

const ScreenWrapper = ({ children, backgroundColor = 'transparent' }: Props) => {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});

export default ScreenWrapper;
