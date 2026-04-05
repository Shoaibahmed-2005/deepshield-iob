import React, { createContext, useContext, useState } from 'react'

export interface UserProfile {
  userId: string
  enrolled: boolean
  reactionMeanMs: number
  reactionSamples: number[]
  landmarkBaseline: number[]
  parallaxYawMean: number
  enrolledAt: number
}

export const defaultProfile: UserProfile = {
  userId: '',
  enrolled: false,
  reactionMeanMs: 200,
  reactionSamples: [],
  landmarkBaseline: [],
  parallaxYawMean: 1.0,
  enrolledAt: 0,
}

type ProfileContextType = [UserProfile, React.Dispatch<React.SetStateAction<UserProfile>>]

const ProfileContext = createContext<ProfileContextType>([
  defaultProfile,
  () => {},
])

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  return React.createElement(
    ProfileContext.Provider,
    { value: [profile, setProfile] as ProfileContextType },
    children
  )
}

export function useProfile(): ProfileContextType {
  return useContext(ProfileContext)
}

export { ProfileContext }
