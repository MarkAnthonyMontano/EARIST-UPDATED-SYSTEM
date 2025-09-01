import React from 'react';

const Unauthorized = () => {
    return (
        <div 
            style={{
                display: "flex",
                height: "100vh", // Full viewport height
                width: "100%",
                alignItems: "center", // Vertical center
                justifyContent: "center", // Horizontal center
                backgroundColor: "#f8f8f8" // Optional light background
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <h1 style={{ color: "#b71c1c" }}>Unauthorized Access</h1>
                <p>
                    You do not have access to this page. <br />
                    Please contact the administrator.
                </p>
            </div>
        </div>
    );
};

export default Unauthorized;
