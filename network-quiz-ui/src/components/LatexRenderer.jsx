import React, { useEffect, useRef } from 'react';

export default function LatexRenderer({ text, className = "" }) {
    const containerRef = useRef(null);

    useEffect(() => {
        // Run KaTeX auto-render on the target container element if available
        if (containerRef.current && window.renderMathInElement) {
            try {
                window.renderMathInElement(containerRef.current, {
                    delimiters: [
                        { left: "$$", right: "$$", display: true },
                        { left: "$", right: "$", display: false },
                        { left: "\\(", right: "\\)", display: false },
                        { left: "\\[", right: "\\]", display: true }
                    ],
                    throwOnError: false
                });
            } catch (err) {
                console.error("KaTeX auto-render error:", err);
            }
        } else if (containerRef.current) {
            // In case CDN resources are still loading, retry after a tiny delay
            const timer = setTimeout(() => {
                if (window.renderMathInElement) {
                    try {
                        window.renderMathInElement(containerRef.current, {
                            delimiters: [
                                { left: "$$", right: "$$", display: true },
                                { left: "$", right: "$", display: false },
                                { left: "\\(", right: "\\)", display: false },
                                { left: "\\[", right: "\\]", display: true }
                            ],
                            throwOnError: false
                        });
                    } catch (err) {
                        console.error("KaTeX delayed auto-render error:", err);
                    }
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [text]);

    return (
        <div 
            ref={containerRef} 
            className={`whitespace-pre-wrap break-words leading-relaxed ${className}`}
        >
            {text}
        </div>
    );
}
