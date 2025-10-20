export function generateAvatar(name: string) {
    if (!name) return '';
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;

    if (context) {
        // Simple hash function for color generation
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = hash % 360;
        context.fillStyle = `hsl(${h}, 60%, 80%)`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = `hsl(${h}, 80%, 30%)`;
        context.font = 'bold 60px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(initials, canvas.width / 2, canvas.height / 2);
    }
    
    return canvas.toDataURL();
}