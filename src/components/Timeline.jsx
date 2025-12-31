import { PhotoCard } from './PhotoCard';

export const Timeline = ({ groups, onDelete, onPhotoClick, isTrashView }) => {
    return (
        <div style={{ paddingBottom: '4rem' }}>
            {groups.map((group) => (
                <div key={group.date} style={{ marginBottom: '3rem' }}>
                    <div
                        style={{
                            position: 'sticky',
                            top: '1rem',
                            zIndex: 10,
                            display: 'inline-block',
                            marginBottom: '1.5rem'
                        }}
                    >
                        <h2
                            className="glass-panel"
                            style={{
                                margin: 0,
                                padding: '0.5rem 1.5rem',
                                fontSize: '1rem',
                                color: 'var(--text-secondary)',
                                borderRadius: '100px',
                                fontWeight: 500
                            }}
                        >
                            {new Date(group.date).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </h2>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '1rem',
                        }}
                    >
                        <style>{`
                            @media (max-width: 768px) {
                                div > div > div {
                                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)) !important;
                                    gap: 0.5rem !important;
                                }
                            }
                        `}</style>
                        {group.photos.map(photo => (
                            <PhotoCard
                                key={photo.id}
                                photo={photo}
                                onDelete={onDelete}
                                onClick={() => onPhotoClick(photo)}
                                isTrashView={isTrashView}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
