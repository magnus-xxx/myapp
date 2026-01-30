import React from 'react'

// Google Logo - Official "G" colored logo
export const GoogleLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path
            d="M47.532 24.5528C47.532 22.9214 47.3997 21.2811 47.1175 19.6761H24.48V28.9181H37.4434C36.9055 31.8988 35.177 34.5356 32.6461 36.2111V42.2078H40.3801C44.9217 38.0278 47.532 31.8547 47.532 24.5528Z"
            fill="#4285F4"
        />
        <path
            d="M24.48 48.0016C30.9529 48.0016 36.4116 45.8764 40.3888 42.2078L32.6549 36.2111C30.5031 37.675 27.7252 38.5039 24.4888 38.5039C18.2275 38.5039 12.9187 34.2798 11.0139 28.6006H3.03296V34.7825C7.10718 42.8868 15.4056 48.0016 24.48 48.0016Z"
            fill="#34A853"
        />
        <path
            d="M11.0051 28.6006C9.99973 25.6199 9.99973 22.3922 11.0051 19.4115V13.2296H3.03298C-0.371021 20.0112 -0.371021 28.0009 3.03298 34.7825L11.0051 28.6006Z"
            fill="#FBBC04"
        />
        <path
            d="M24.48 9.49932C27.9016 9.44641 31.2086 10.7339 33.6866 13.0973L40.5387 6.24523C36.2 2.17101 30.4414 -0.068932 24.48 0.00161733C15.4055 0.00161733 7.10718 5.11644 3.03296 13.2296L11.005 19.4115C12.901 13.7235 18.2187 9.49932 24.48 9.49932Z"
            fill="#EA4335"
        />
    </svg>
)

// OpenAI Logo - Stylized swirl
export const OpenAILogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect width={48} height={48} rx={8} fill="#10a37f" />
        <path
            d="M36.5 18.5C36.5 15.5 34.5 13 31.5 12.5C31 10 29 8 26.5 8C24.5 8 22.5 9 21.5 10.5C19.5 10.5 17.5 11.5 16.5 13.5C14 14 12 16.5 12 19C12 20.5 12.5 22 13.5 23C13 24 12.5 25.5 12.5 27C12.5 30 14.5 32.5 17.5 33C18 35.5 20 37.5 22.5 37.5C24.5 37.5 26.5 36.5 27.5 35C29.5 35 31.5 34 32.5 32C35 31.5 37 29 37 26.5C37 25 36.5 23.5 35.5 22.5C36 21.5 36.5 20 36.5 18.5Z"
            fill="white"
        />
        <circle cx={24} cy={24} r={6} fill="#10a37f" />
    </svg>
)

// Spotify Logo - Green circle with sound waves
export const SpotifyLogo: React.FC<{ size?: number }> = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <circle cx={24} cy={24} r={24} fill="#1DB954" />
        <path
            d="M34.5 20.5C28.5 17 19.5 16.5 13.5 18.5C12.5 18.8 11.5 18.2 11.2 17.2C10.9 16.2 11.5 15.2 12.5 14.9C19.5 12.6 29.5 13.2 36.5 17.2C37.4 17.7 37.7 18.9 37.2 19.8C36.7 20.7 35.4 21 34.5 20.5Z"
            fill="white"
        />
        <path
            d="M34 26C28.8 23 20.5 22.2 13.8 24C12.9 24.2 12 23.6 11.8 22.7C11.6 21.8 12.2 20.9 13.1 20.7C20.7 18.7 29.9 19.6 36 23C36.8 23.4 37.1 24.5 36.7 25.3C36.3 26.1 35.2 26.4 34.4 26H34Z"
            fill="white"
        />
        <path
            d="M33 31C28.5 28.5 22 27.8 14 29.5C13.2 29.7 12.5 29.2 12.3 28.4C12.1 27.6 12.6 26.9 13.4 26.7C22.2 24.9 29.5 25.7 34.7 28.5C35.4 28.9 35.6 29.8 35.2 30.5C34.8 31.2 33.9 31.4 33.2 31H33Z"
            fill="white"
        />
    </svg>
)

// Generic placeholder icon for future integrations
export const PlaceholderLogo: React.FC<{ size?: number; letter?: string }> = ({
    size = 32,
    letter = '?'
}) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect width={48} height={48} rx={8} fill="rgba(255, 255, 255, 0.1)" />
        <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="#6b7280"
            fontSize={20}
            fontWeight="600"
        >
            {letter}
        </text>
    </svg>
)
