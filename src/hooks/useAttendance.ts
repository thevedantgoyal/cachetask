import { useState, useCallback } from "react";

export type AttendanceStep = "disclaimer" | "face" | "location" | "confirmation";
export type VerificationStatus = "pending" | "verifying" | "success" | "failed";

export interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "pending";
  checkInTime: string | null;
  faceVerified: boolean;
  locationVerified: boolean;
  distance: number | null;
  verificationMethod: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  distance: number;
  isWithinRadius: boolean;
}

// Office location coordinates
const OFFICE_LOCATION = {
  latitude: 28.49726565449399,
  longitude: 77.1633343946611,
  radius: 100, // meters
};

// Mock attendance history
const MOCK_ATTENDANCE_HISTORY: AttendanceRecord[] = [
  {
    id: "1",
    date: "2026-02-04",
    status: "present",
    checkInTime: "09:15:32",
    faceVerified: true,
    locationVerified: true,
    distance: 45,
    verificationMethod: "Face + Geo-fence",
  },
  {
    id: "2",
    date: "2026-02-03",
    status: "present",
    checkInTime: "09:02:18",
    faceVerified: true,
    locationVerified: true,
    distance: 23,
    verificationMethod: "Face + Geo-fence",
  },
  {
    id: "3",
    date: "2026-02-02",
    status: "absent",
    checkInTime: null,
    faceVerified: false,
    locationVerified: false,
    distance: null,
    verificationMethod: "Not attempted",
  },
  {
    id: "4",
    date: "2026-02-01",
    status: "present",
    checkInTime: "08:58:45",
    faceVerified: true,
    locationVerified: true,
    distance: 67,
    verificationMethod: "Face + Geo-fence",
  },
  {
    id: "5",
    date: "2026-01-31",
    status: "present",
    checkInTime: "09:30:12",
    faceVerified: true,
    locationVerified: true,
    distance: 12,
    verificationMethod: "Face + Geo-fence",
  },
];

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const useAttendance = () => {
  const [currentStep, setCurrentStep] = useState<AttendanceStep>("disclaimer");
  const [faceStatus, setFaceStatus] = useState<VerificationStatus>("pending");
  const [locationStatus, setLocationStatus] = useState<VerificationStatus>("pending");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [todayMarked, setTodayMarked] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>(
    MOCK_ATTENDANCE_HISTORY
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const officeRadius = OFFICE_LOCATION.radius;

  const startAttendanceFlow = useCallback(() => {
    setCurrentStep("face");
    setFaceStatus("pending");
    setLocationStatus("pending");
    setLocationData(null);
    setErrorMessage(null);
  }, []);

  const simulateFaceVerification = useCallback(async (): Promise<boolean> => {
    setFaceStatus("verifying");
    
    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    // 85% success rate for demo
    const success = Math.random() > 0.15;
    
    if (success) {
      setFaceStatus("success");
      setCurrentStep("location");
      return true;
    } else {
      setFaceStatus("failed");
      setErrorMessage("Face verification failed. Please ensure good lighting and try again.");
      return false;
    }
  }, []);

  const retryFaceVerification = useCallback(() => {
    setFaceStatus("pending");
    setErrorMessage(null);
  }, []);

  const verifyLocation = useCallback(async (): Promise<boolean> => {
    setLocationStatus("verifying");

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationStatus("failed");
        setErrorMessage("Geolocation is not supported by your browser.");
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const distance = calculateDistance(
            latitude,
            longitude,
            OFFICE_LOCATION.latitude,
            OFFICE_LOCATION.longitude
          );

          const isWithinRadius = distance <= OFFICE_LOCATION.radius;

          setLocationData({
            latitude,
            longitude,
            accuracy,
            distance: Math.round(distance),
            isWithinRadius,
          });

          // Simulate processing delay
          setTimeout(() => {
            if (isWithinRadius) {
              setLocationStatus("success");
              setCurrentStep("confirmation");
              resolve(true);
            } else {
              setLocationStatus("failed");
              setErrorMessage(
                `You are ${Math.round(distance)}m away from the office. Please move within ${OFFICE_LOCATION.radius}m radius.`
              );
              resolve(false);
            }
          }, 1500);
        },
        (error) => {
          setLocationStatus("failed");
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setErrorMessage("Location permission denied. Please enable location access.");
              break;
            case error.POSITION_UNAVAILABLE:
              setErrorMessage("Location information unavailable.");
              break;
            case error.TIMEOUT:
              setErrorMessage("Location request timed out. Please try again.");
              break;
            default:
              setErrorMessage("An unknown error occurred while fetching location.");
          }
          resolve(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const confirmAttendance = useCallback(() => {
    const now = new Date();
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      date: now.toISOString().split("T")[0],
      status: "present",
      checkInTime: now.toTimeString().split(" ")[0],
      faceVerified: true,
      locationVerified: true,
      distance: locationData?.distance || 0,
      verificationMethod: "Face + Geo-fence",
    };

    setAttendanceHistory((prev) => [newRecord, ...prev]);
    setTodayMarked(true);
  }, [locationData]);

  const resetFlow = useCallback(() => {
    setCurrentStep("disclaimer");
    setFaceStatus("pending");
    setLocationStatus("pending");
    setLocationData(null);
    setErrorMessage(null);
  }, []);

  const getTodayAttendance = useCallback((): AttendanceRecord | null => {
    const today = new Date().toISOString().split("T")[0];
    return attendanceHistory.find((record) => record.date === today) || null;
  }, [attendanceHistory]);

  return {
    currentStep,
    faceStatus,
    locationStatus,
    locationData,
    todayMarked,
    attendanceHistory,
    errorMessage,
    officeRadius,
    startAttendanceFlow,
    simulateFaceVerification,
    retryFaceVerification,
    verifyLocation,
    confirmAttendance,
    resetFlow,
    getTodayAttendance,
  };
};
