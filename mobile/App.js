import React, { useEffect, useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';

export default function App() {
  const [location, setLocation] = useState(null);
  const [comment, setComment] = useState('');
  const [reportId, setReportId] = useState(null);

  useEffect(() => {
    async function requestLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    }
    requestLocation();
  }, []);

  const submitReport = async () => {
    if (!location) {
      return;
    }

    const payload = {
      photos: ['https://example.com/photo-placeholder.jpg'],
      gps: { lat: location.latitude, lon: location.longitude },
      timestamp: new Date().toISOString(),
      comment,
    };

    const response = await fetch('http://127.0.0.1:8000/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setReportId(data.report_id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>SwachhLens Citizen Report</Text>
        <Text style={styles.label}>Location</Text>
        <Text>{location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'Obtaining location...'}</Text>
        <Text style={styles.label}>Comment</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Describe the waste issue"
          style={styles.input}
          multiline
        />
        <Button title="Submit report" onPress={submitReport} />
        {reportId ? <Text style={styles.success}>Report submitted: {reportId}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  content: { padding: 24 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 16, marginTop: 12, marginBottom: 6 },
  input: { borderColor: '#cccccc', borderWidth: 1, borderRadius: 8, padding: 10, backgroundColor: '#fff', minHeight: 100 },
  success: { marginTop: 18, fontWeight: '600', color: '#006400' },
});
