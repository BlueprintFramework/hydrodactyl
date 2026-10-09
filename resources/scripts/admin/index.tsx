import { createRoot } from 'react-dom/client';

import AdminApp from '@/components/admin/AdminApp';

const container = document.getElementById('admin-app');
if (container) {
    const root = createRoot(container);
    root.render(<AdminApp />);
} else {
    console.error('Failed to find the admin root element');
}
