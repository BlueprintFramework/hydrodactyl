import md5 from 'md5';
import { useEffect, useState } from 'react';

interface AvatarProps {
    email: string;
    text?: string;
    size?: number;
    rounded?: number;
}

export function Avatar({ email, text = '', size = 32, rounded = 32 }: AvatarProps) {
    const [src, setSrc] = useState<string>('');

    useEffect(() => {
        const hash = md5(email.trim().toLowerCase());
        const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=${size}`;

        fetch(gravatarUrl)
            .then((res) => {
                if (res.ok) {
                    setSrc(gravatarUrl);
                } else {
                    // Gravatar returned 404 — fall back to generated avatar
                    return getAvatar({ name: email, text, size, rounded });
                }
            })
            .then((fallbackSrc) => {
                if (fallbackSrc) setSrc(fallbackSrc);
            })
            .catch(console.error);
    }, [email, text, size, rounded]);

    return <img src={src} alt={`Avatar for ${email}`} width={size} height={size} style={{ borderRadius: rounded }} />;
}
