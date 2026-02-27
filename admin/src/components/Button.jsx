import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    onClick,
    type = 'button',
    className = '',
    ...props
}) => {
    const baseStyles = "font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-primary-500 hover:bg-primary-600 text-white glow-primary hover:-translate-y-0.5",
        secondary: "bg-[#252D3A] hover:bg-primary-500/20 text-gray-200 border border-[#333D4D] hover:border-primary-400",
        success: "bg-green-500 hover:bg-green-600 text-white glow-red hover:-translate-y-0.5",
        danger: "bg-red-500 hover:bg-red-600 text-white glow-red hover:-translate-y-0.5",
        ghost: "bg-transparent hover:bg-[#252D3A] text-gray-300 hover:text-white border border-[#333D4D] hover:border-primary-400",
        outline: "bg-transparent hover:bg-primary-500/20 text-primary-400 border border-primary-400/50 hover:border-primary-500",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {!loading && Icon && <Icon className="w-4 h-4" />}
            {children}
        </button>
    );
};

export default Button;
