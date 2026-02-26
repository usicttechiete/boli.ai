import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type AccuracyRingProps = {
    score: number;
    size?: number;
    tintColor?: string;
    strokeWidth?: number;
};

export function AccuracyRing({
    score,
    size = 120,
    tintColor = '#10b981',
    strokeWidth = 10
}: AccuracyRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {/* Background Ring - Simulated with borders */}
            <View style={[
                StyleSheet.absoluteFillObject,
                {
                    borderRadius: size / 2,
                    borderWidth: strokeWidth,
                    borderColor: tintColor + '20', // Opacity background
                }
            ]} />

            {/* Foreground Ring - Simulated by overlapping transparent bordered circles */}
            <View style={[
                StyleSheet.absoluteFillObject,
                {
                    borderRadius: size / 2,
                    borderWidth: strokeWidth,
                    borderColor: tintColor,
                    borderTopColor: 'transparent',
                    borderRightColor: score < 75 ? 'transparent' : tintColor,
                    borderBottomColor: score < 50 ? 'transparent' : tintColor,
                    borderLeftColor: score < 25 ? 'transparent' : tintColor,
                    transform: [{ rotate: '-45deg' }]
                }
            ]} />

            {/* Inner Content */}
            <View style={styles.contentContainer}>
                <View style={styles.scoreRow}>
                    <ThemedText style={[styles.scoreText, { color: tintColor }]}>{score}</ThemedText>
                </View>
                <ThemedText style={styles.maxScore}>/100</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    contentContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    scoreText: {
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 36,
    },
    maxScore: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '600',
        marginTop: -4,
    },
});
