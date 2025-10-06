// Composant de notation par chiffres (1-10)
function StarRating({ value, onChange, readonly = false, size = 'md' }) {
    const { useState } = React;
    const [hoverValue, setHoverValue] = useState(null);

    const maxRating = 10;

    const handleClick = (rating) => {
        if (!readonly && onChange) {
            onChange(rating);
        }
    };

    const handleMouseEnter = (rating) => {
        if (!readonly) {
            setHoverValue(rating);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverValue(null);
        }
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-12 h-12 text-lg',
        lg: 'w-14 h-14 text-xl'
    };

    const buttonSize = sizeClasses[size] || sizeClasses.md;

    return React.createElement('div', {
        className: "flex items-start gap-2"
    }, Array.from({ length: maxRating }, (_, index) => {
        const rating = index + 1;
        const isSelected = rating === value;
        const isHovered = rating === hoverValue;

        // Déterminer le label à afficher
        let label = '';
        if (rating === 1) label = 'mauvais';
        if (rating === 10) label = 'super';

        return React.createElement('div', {
            key: rating,
            className: "flex flex-col items-center"
        }, [
            React.createElement('button', {
                key: 'button',
                type: 'button',
                onClick: () => handleClick(rating),
                onMouseEnter: () => handleMouseEnter(rating),
                onMouseLeave: handleMouseLeave,
                disabled: readonly,
                className: `${buttonSize} rounded-md transition-all duration-150 font-bold ${
                    readonly ? 'cursor-default' : 'cursor-pointer hover:scale-105'
                } ${
                    isSelected
                        ? 'bg-blue-900 text-white border-[3px] border-blue-900'
                        : isHovered
                        ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`,
                'aria-label': `Note ${rating} sur ${maxRating}`
            }, rating),
            React.createElement('span', {
                key: 'label',
                className: "text-sm text-gray-500 font-medium mt-1",
                style: { minHeight: '20px' }
            }, label)
        ]);
    }));
}

// Composant de notation Qualiopi (0-5)
function QualiopiRating({ value, onChange, readonly = false, size = 'sm' }) {
    const { useState } = React;
    const [hoverValue, setHoverValue] = useState(null);

    const minRating = 0;
    const maxRating = 5;

    const handleClick = (rating) => {
        if (!readonly && onChange) {
            onChange(rating);
        }
    };

    const handleMouseEnter = (rating) => {
        if (!readonly) {
            setHoverValue(rating);
        }
    };

    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverValue(null);
        }
    };

    const sizeClasses = {
        sm: 'w-10 h-10 text-base',
        md: 'w-12 h-12 text-lg',
        lg: 'w-14 h-14 text-xl'
    };

    const buttonSize = sizeClasses[size] || sizeClasses.sm;

    return React.createElement('div', {
        className: "flex items-start gap-2"
    }, Array.from({ length: maxRating - minRating + 1 }, (_, index) => {
        const rating = minRating + index;
        const isSelected = rating === value;
        const isHovered = rating === hoverValue;

        // Déterminer le label à afficher
        let label = '';
        if (rating === 0) label = 'nul';
        if (rating === 5) label = 'pro';

        return React.createElement('div', {
            key: rating,
            className: "flex flex-col items-center"
        }, [
            React.createElement('button', {
                key: 'button',
                type: 'button',
                onClick: () => handleClick(rating),
                onMouseEnter: () => handleMouseEnter(rating),
                onMouseLeave: handleMouseLeave,
                disabled: readonly,
                className: `${buttonSize} rounded-md transition-all duration-150 font-bold ${
                    readonly ? 'cursor-default' : 'cursor-pointer hover:scale-105'
                } ${
                    isSelected
                        ? 'bg-blue-900 text-white border-[3px] border-blue-900'
                        : isHovered
                        ? 'bg-blue-100 text-blue-900 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`,
                'aria-label': `Note ${rating} sur ${maxRating}`
            }, rating),
            React.createElement('span', {
                key: 'label',
                className: "text-sm text-gray-500 font-medium mt-1",
                style: { minHeight: '20px' }
            }, label)
        ]);
    }));
}

// Export global
window.StarRating = StarRating;
window.QualiopiRating = QualiopiRating;
