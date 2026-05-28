import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface ActionMenuItem {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    danger?: boolean;
}

interface ActionMenuProps {
    items: ActionMenuItem[];
    triggerIcon: ReactNode;
    triggerClassName?: string;
}

/**
 * ActionMenu renders a floating dropdown positioned using fixed coordinates
 * so it always appears above everything (including overflow:hidden/auto containers).
 */
export function ActionMenu({ items, triggerIcon, triggerClassName }: ActionMenuProps) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const menuWidth = 160;
            let left = rect.right - menuWidth;
            if (left < 8) left = 8;
            setPos({ top: rect.bottom + 4, left });
        }
        setOpen(prev => !prev);
    };

    // Close on outside click / scroll / resize
    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        document.addEventListener('mousedown', close);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('mousedown', close);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [open]);

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className={triggerClassName ?? 'p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'}
            >
                {triggerIcon}
            </button>
            {open && (
                <div
                    ref={menuRef}
                    onMouseDown={e => e.stopPropagation()}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 160 }}
                    className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                >
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                item.onClick();
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${item.danger
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
