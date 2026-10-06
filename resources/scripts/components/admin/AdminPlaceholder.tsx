interface Props {
    title: string;
    description?: string;
}

const AdminPlaceholder = ({ title, description }: Props) => {
    return (
        <div className='box' style={{ borderTop: '3px solid var(--color-brand)' }}>
            <div className='box-header with-border'>
                <h3 className='box-title'>{title}</h3>
            </div>
            <div className='box-body'>
                <p style={{ margin: 0, color: 'var(--color-secondary)' }}>
                    {description ?? 'This section is coming soon as part of the admin panel redesign.'}
                </p>
            </div>
        </div>
    );
};

export default AdminPlaceholder;
