const Container = ({ children, className = '' }) => {
    return (
        <div className={`mx-[3%] ${className}`}>
            {children}
        </div>
    );
};

export default Container;
