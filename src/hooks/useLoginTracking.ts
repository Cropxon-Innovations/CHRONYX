import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
}

const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent;
  
  // Detect device type
  let deviceType = "Desktop";
  if (/Mobi|Android/i.test(userAgent)) {
    deviceType = "Mobile";
  } else if (/Tablet|iPad/i.test(userAgent)) {
    deviceType = "Tablet";
  }
  
  // Detect browser
  let browser = "Unknown";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("Edg")) {
    browser = "Edge";
  } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
    browser = "Opera";
  }
  
  // Detect OS
  let os = "Unknown";
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
  }
  
  return { deviceType, browser, os };
};

interface LocationInfo {
  country: string;
  city: string;
  ip: string;
}

const getLocationInfo = async (): Promise<LocationInfo> => {
  try {
    // Use a free IP geolocation API
    const response = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch location");
    }
    
    const data = await response.json();
    return {
      country: data.country_name || "Unknown",
      city: data.city || "Unknown",
      ip: data.ip || "Unknown",
    };
  } catch (error) {
    console.error("Failed to get location info:", error);
    return {
      country: "Unknown",
      city: "Unknown",
      ip: "Unknown",
    };
  }
};

export const trackLogin = async (
  user: User,
  loginMethod: string = "password",
  status: string = "success"
): Promise<void> => {
  try {
    const deviceInfo = getDeviceInfo();
    const locationInfo = await getLocationInfo();
    
    const { error } = await supabase.from("login_history").insert({
      user_id: user.id,
      ip_address: locationInfo.ip,
      user_agent: navigator.userAgent,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      country: locationInfo.country,
      city: locationInfo.city,
      login_method: loginMethod,
      status: status,
      session_id: user.id + "_" + Date.now(),
    });
    
    if (error) {
      console.error("Failed to track login:", error);
    } else {
      console.log("Login tracked successfully");
    }
  } catch (error) {
    console.error("Error tracking login:", error);
  }
};
