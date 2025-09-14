'use client';
// @ts-nocheck

import React, { useEffect, useRef, useState } from 'react';
import { Event, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings,
  Monitor,
  Globe,
  Headphones,
  Eye,
  EyeOff,
  MessageSquare,
  UserPlus
} from 'lucide-react';

// A-Frame script loading utility
const loadAFrame = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).AFRAME) {
      resolve((window as any).AFRAME);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
    script.onload = () => resolve((window as any).AFRAME);
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// VR Networking Components
const VRScene = ({ event, user, participants }: {
  event: Event;
  user: User;
  participants: User[];
}) => {
  const sceneRef = useRef<HTMLElement>(null);
  const [isVRSupported, setIsVRSupported] = useState(false);
  const [isInVR, setIsInVR] = useState(false);

  useEffect(() => {
    const initVR = async () => {
      try {
        await loadAFrame();
        const AFRAME = (window as any).AFRAME;
        
        // Check VR support
        if (navigator.getVRDisplays) {
          const displays = await navigator.getVRDisplays();
          setIsVRSupported(displays.length > 0);
        } else if ('xr' in navigator) {
          const supported = await (navigator as any).xr.isSessionSupported('immersive-vr');
          setIsVRSupported(supported);
        }

        // Custom components for networking
        AFRAME.registerComponent('networking-avatar', {
          schema: {
            userId: { type: 'string' },
            username: { type: 'string' },
            position: { type: 'vec3' }
          },
          init: function() {
            const el = this.el;
            const data = this.data;

            // Create avatar representation
            el.setAttribute('geometry', 'primitive: cylinder; height: 1.8; radius: 0.3');
            el.setAttribute('material', `color: ${this.generateUserColor(data.userId)}`);

            // Add name tag
            const nameTag = document.createElement('a-text');
            nameTag.setAttribute('value', data.username);
            nameTag.setAttribute('position', '0 1 0');
            nameTag.setAttribute('align', 'center');
            nameTag.setAttribute('color', 'white');
            nameTag.setAttribute('scale', '2 2 2');
            el.appendChild(nameTag);

            // Add interaction listener
            el.addEventListener('click', () => {
              this.onAvatarClick(data.userId);
            });
          },
          generateUserColor: function(userId: string) {
            // Generate consistent color based on user ID
            let hash = 0;
            for (let i = 0; i < userId.length; i++) {
              hash = userId.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = hash % 360;
            return `hsl(${hue}, 70%, 60%)`;
          },
          onAvatarClick: function(userId: string) {
            // Handle avatar interaction
            console.log('Avatar clicked:', userId);
            // Open networking panel or start conversation
          }
        });

        AFRAME.registerComponent('networking-zone', {
          schema: {
            topic: { type: 'string' },
            capacity: { type: 'number', default: 8 }
          },
          init: function() {
            const el = this.el;
            const data = this.data;

            // Create zone visualization
            el.setAttribute('geometry', 'primitive: cylinder; height: 0.1; radius: 3');
            el.setAttribute('material', 'color: #4F94CD; transparent: true; opacity: 0.3');

            // Add topic label
            const label = document.createElement('a-text');
            label.setAttribute('value', data.topic);
            label.setAttribute('position', '0 0.2 0');
            label.setAttribute('align', 'center');
            label.setAttribute('color', 'white');
            label.setAttribute('scale', '3 3 3');
            el.appendChild(label);
          }
        });

        AFRAME.registerComponent('presentation-screen', {
          schema: {
            src: { type: 'string' },
            title: { type: 'string' }
          },
          init: function() {
            const el = this.el;
            const data = this.data;

            // Create screen
            el.setAttribute('geometry', 'primitive: plane; width: 6; height: 4');
            el.setAttribute('material', `src: ${data.src || '#default-presentation'}`);

            // Add frame
            const frame = document.createElement('a-box');
            frame.setAttribute('position', '0 0 -0.1');
            frame.setAttribute('scale', '6.2 4.2 0.1');
            frame.setAttribute('material', 'color: black');
            el.appendChild(frame);
          }
        });

      } catch (error) {
        console.error('VR initialization failed:', error);
      }
    };

    initVR();
  }, []);

  const renderVRSpace = () => {
    const vrConfig = event.vrSpaceData || {
      sceneType: 'networking',
      maxParticipants: 50,
      spatialAudio: true,
      avatarSystem: true,
      interactiveObjects: []
    };

    return (
      <div 
        ref={sceneRef as any}
        style={{ height: '500px', width: '100%' }}
        dangerouslySetInnerHTML={{
          __html: `
            <a-scene embedded vr-mode-ui="enabled: true" background="color: #87CEEB" fog="type: linear; color: #87CEEB; far: 50; near: 20">
              <a-assets>
                <img id="ground-texture" src="/textures/grass.jpg" />
                <img id="sky-texture" src="/textures/sky.jpg" />
                <img id="default-presentation" src="/images/default-presentation.jpg" />
                <a-sound id="ambient-sound" src="/audio/ambient-networking.mp3" autoplay loop></a-sound>
              </a-assets>
              
              <a-sky src="#sky-texture"></a-sky>
              <a-plane position="0 0 -4" rotation="-90 0 0" width="100" height="100" color="#7BC043" src="#ground-texture" repeat="10 10"></a-plane>
              
              <a-light type="ambient" color="#404040" intensity="0.4"></a-light>
              <a-light type="directional" position="1 4 2" color="#FFF" intensity="0.8"></a-light>
              
              <a-entity networking-zone="topic: Career Development; capacity: 8" position="5 0.1 0"></a-entity>
              <a-entity networking-zone="topic: Tech Innovation; capacity: 8" position="-5 0.1 0"></a-entity>
              <a-entity networking-zone="topic: Entrepreneurship; capacity: 8" position="0 0.1 5"></a-entity>
              
              <a-entity presentation-screen="src: #default-presentation; title: Welcome to VR Networking" position="0 3 -8" rotation="0 0 0"></a-entity>
              
              <a-box position="8 1 0" scale="1 2 1" color="#4CC3D9" shadow>
                <a-text value="Event Info" position="0 1.2 0.6" align="center" color="white" scale="2 2 2"></a-text>
              </a-box>
              
              <a-entity id="rig" movement-controls="constrainToNavMesh: false" position="0 1.6 3">
                <a-camera look-controls="pointerLockEnabled: true" wasd-controls="acceleration: 20" cursor="rayOrigin: mouse; fuse: true; fuseTimeout: 2000">
                  <a-cursor position="0 0 -1" geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03" material="color: white; shader: flat"></a-cursor>
                </a-camera>
                <a-entity id="left-hand" laser-controls="hand: left" hand-tracking-controls="hand: left"></a-entity>
                <a-entity id="right-hand" laser-controls="hand: right" hand-tracking-controls="hand: right"></a-entity>
              </a-entity>
              
              <a-entity id="vr-ui" position="0 2.5 -2" geometry="primitive: plane; width: 3; height: 1.5" material="color: #000; transparent: true; opacity: 0.8">
                <a-text value="Event: ${event.title}\\nParticipants: ${participants.length}\\nZones: 3 Active" position="0 0 0.01" align="center" color="white" scale="1.5 1.5 1.5"></a-text>
              </a-entity>
            </a-scene>
          `
        }}
      />
    );
  };

  return (
    <div className="vr-scene-container">
      {renderVRSpace()}
    </div>
  );
};

interface VRNetworkingProps {
  event: Event;
  user: User;
  participants: User[];
  onJoinEvent: (eventId: string) => void;
  onLeaveEvent: (eventId: string) => void;
}

export default function VRNetworking({ 
  event, 
  user, 
  participants, 
  onJoinEvent, 
  onLeaveEvent 
}: VRNetworkingProps) {
  const [isVRMode, setIsVRMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isInVR, setIsInVR] = useState(false);
  const [vrSupported, setVRSupported] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    user: string;
    message: string;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    // Check VR support
    const checkVRSupport = async () => {
      if (typeof window !== 'undefined') {
        try {
          if ('xr' in navigator) {
            const supported = await (navigator as any).xr.isSessionSupported('immersive-vr');
            setVRSupported(supported);
          } else if (navigator.getVRDisplays) {
            const displays = await navigator.getVRDisplays();
            setVRSupported(displays.length > 0);
          }
        } catch (error) {
          console.log('VR support check failed:', error);
        }
      }
    };

    checkVRSupport();
  }, []);

  const toggleVRMode = () => {
    setIsVRMode(!isVRMode);
    if (!isVRMode) {
      setIsInVR(true);
    } else {
      setIsInVR(false);
    }
  };

  const networkingZones = [
    {
      id: 'career-dev',
      title: 'Career Development',
      description: 'Discuss career paths, job opportunities, and professional growth',
      participants: 12,
      capacity: 15,
      color: '#4F94CD'
    },
    {
      id: 'tech-innovation',
      title: 'Tech Innovation',
      description: 'Latest trends in technology, startups, and innovation',
      participants: 8,
      capacity: 12,
      color: '#9932CC'
    },
    {
      id: 'entrepreneurship',
      title: 'Entrepreneurship',
      description: 'Business ideas, startup stories, and entrepreneurial advice',
      participants: 6,
      capacity: 10,
      color: '#FF6347'
    }
  ];

  const joinNetworkingZone = (zoneId: string) => {
    setSelectedZone(zoneId);
    // Implement VR zone joining logic
  };

  const sendChatMessage = (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      user: `${user.firstName} ${user.lastName}`,
      message,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="vr-networking-container max-w-7xl mx-auto p-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* VR Experience Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-6 w-6 text-blue-600" />
                    VR Networking Event
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{event.title}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={vrSupported ? "default" : "secondary"}>
                    {vrSupported ? "VR Ready" : "VR Not Available"}
                  </Badge>
                  <Badge variant="outline">{participants.length} Participants</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isVRMode ? (
                <div className="vr-scene-wrapper relative">
                  <VRScene 
                    event={event}
                    user={user}
                    participants={participants}
                  />
                  
                  {/* VR Controls Overlay */}
                  <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-4 text-white">
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className="text-white hover:bg-white/20"
                      >
                        {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setVideoEnabled(!videoEnabled)}
                        className="text-white hover:bg-white/20"
                      >
                        {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleVRMode}
                        className="text-white hover:bg-white/20"
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="preview-mode p-8 text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <Headphones className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Immersive VR Networking</h3>
                    <p className="text-gray-600 mb-6">
                      Experience next-generation networking in virtual reality. Move around, 
                      join conversation zones, and connect with alumni in a shared virtual space.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-4 bg-white rounded-lg shadow">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="font-semibold">{participants.length}</div>
                      <div className="text-sm text-gray-600">Active Participants</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow">
                      <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="font-semibold">3</div>
                      <div className="text-sm text-gray-600">Networking Zones</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg shadow">
                      <Globe className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="font-semibold">VR/AR</div>
                      <div className="text-sm text-gray-600">Full Experience</div>
                    </div>
                  </div>

                  <Button 
                    onClick={toggleVRMode} 
                    size="lg" 
                    className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Enter VR Experience
                  </Button>
                  
                  {!vrSupported && (
                    <p className="text-sm text-amber-600 mt-4">
                      For the full VR experience, use a VR headset or VR-compatible browser.
                      The experience will work in 3D mode on desktop/mobile.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Networking Zones & Chat */}
        <div className="space-y-6">
          {/* Networking Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Networking Zones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {networkingZones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedZone === zone.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => joinNetworkingZone(zone.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{zone.title}</h4>
                    <Badge 
                      variant="outline" 
                      style={{ color: zone.color, borderColor: zone.color }}
                    >
                      {zone.participants}/{zone.capacity}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{zone.description}</p>
                  <Progress 
                    value={(zone.participants / zone.capacity) * 100} 
                    className="h-1"
                  />
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => joinNetworkingZone('new')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create New Zone
              </Button>
            </CardContent>
          </Card>

          {/* Live Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Event Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 h-64 overflow-y-auto mb-3 p-3 bg-gray-50 rounded">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <div className="font-semibold text-blue-600">{msg.user}</div>
                    <div className="text-gray-800">{msg.message}</div>
                    <div className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 text-sm">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      sendChatMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button size="sm">Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}