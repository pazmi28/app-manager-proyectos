import { useState } from 'react';

export default function ChecklistItem({ item, onToggle, onUpdateNotes }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes || '');

  function handleNotesBlur() {
    setEditingNotes(false);
    if (notesValue !== item.notes) {
      onUpdateNotes(item.id, notesValue);
    }
  }

  return (
    <div className={`ci-item ${item.done ? 'ci-done' : ''}`}>
      <button
        className={`ci-checkbox ${item.done ? 'ci-checked' : ''}`}
        onClick={() => onToggle(item.id, item.done)}
        aria-label={item.done ? 'Marcar como pendiente' : 'Marcar como completado'}
      >
        {item.done && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      <div className="ci-content">
        <span className="ci-text">{item.item}</span>
        {editingNotes ? (
          <textarea
            className="ci-notes-input"
            value={notesValue}
            onChange={e => setNotesValue(e.target.value)}
            onBlur={handleNotesBlur}
            autoFocus
            placeholder="Añade una nota..."
            rows={2}
          />
        ) : (
          <button
            className="ci-notes-btn"
            onClick={() => setEditingNotes(true)}
          >
            {item.notes ? item.notes : '+ nota'}
          </button>
        )}
      </div>
    </div>
  );
}