// Composant overlay SVG pour highlighter les sections du PDF
function PDFHighlightOverlay({ sections, selectedSectionId, iframeRef }) {
    const { useState, useEffect, useRef } = React;
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [sectionRects, setSectionRects] = useState([]);

    // Observer les changements de dimensions de l'iframe
    useEffect(() => {
        if (!iframeRef || !iframeRef.current) return;

        const updateDimensions = () => {
            const iframe = iframeRef.current;
            if (iframe) {
                const rect = iframe.getBoundingClientRect();
                setDimensions({ width: rect.width, height: rect.height });
            }
        };

        // Initialiser les dimensions
        updateDimensions();

        // Observer le redimensionnement
        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(iframeRef.current);

        // Observer le chargement de l'iframe
        const iframe = iframeRef.current;
        iframe.addEventListener('load', updateDimensions);

        return () => {
            resizeObserver.disconnect();
            iframe.removeEventListener('load', updateDimensions);
        };
    }, [iframeRef]);

    // Calculer les rectangles des sections
    useEffect(() => {
        if (!sections || sections.length === 0 || dimensions.height === 0) {
            setSectionRects([]);
            return;
        }

        // Ratio de conversion mm → pixels
        // A4 = 297mm de hauteur
        const mmToPixelRatio = dimensions.height / 297;
        const mmToPixelRatioWidth = dimensions.width / 210; // A4 = 210mm de largeur

        let currentY = 0;
        const rects = sections.map((section) => {
            // Ajouter le gap du haut
            currentY += section.gapTop * mmToPixelRatio;

            // Position et taille de la section
            const rect = {
                id: section.id,
                name: section.name,
                x: 0, // Toujours à gauche pour l'instant
                y: currentY,
                width: section.width * mmToPixelRatioWidth,
                height: section.height * mmToPixelRatio,
                isSelected: section.id === selectedSectionId
            };

            // Avancer pour la prochaine section
            currentY += section.height * mmToPixelRatio + section.gapBottom * mmToPixelRatio;

            return rect;
        });

        setSectionRects(rects);
    }, [sections, selectedSectionId, dimensions]);

    // Si pas de dimensions ou pas de sections, ne rien afficher
    if (dimensions.width === 0 || dimensions.height === 0 || sectionRects.length === 0) {
        return null;
    }

    return React.createElement('svg', {
        className: 'absolute top-0 left-0 pointer-events-none',
        style: {
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            zIndex: 10
        }
    }, sectionRects.map((rect) =>
        React.createElement('g', { key: rect.id }, [
            // Rectangle de la section
            React.createElement('rect', {
                key: 'rect',
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                fill: rect.isSelected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                stroke: rect.isSelected ? '#ef4444' : '#93c5fd',
                strokeWidth: rect.isSelected ? 3 : 1,
                strokeDasharray: rect.isSelected ? '0' : '5,5'
            }),
            // Label de la section (uniquement pour la section sélectionnée)
            rect.isSelected && React.createElement('text', {
                key: 'label',
                x: rect.x + 5,
                y: rect.y + 15,
                fill: '#ef4444',
                fontSize: '12px',
                fontWeight: 'bold',
                style: { pointerEvents: 'none' }
            }, rect.name)
        ])
    ));
}

// Export global
window.PDFHighlightOverlay = PDFHighlightOverlay;
