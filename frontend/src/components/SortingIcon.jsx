import React, { useState } from "react";
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Container } from "@mui/material";

const SortingIcon = () => {
    const [active, setActive] = useState(null); // "up", "down", or null

    return (
        <Container style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', cursor: 'pointer', marginTop: '-3px',marginRight: '-18px', transform: 'scale(0.7)', width: 'fit-content', position: 'relative'}}>
            <ArrowDropUpIcon
                onClick={() => setActive("up")}
                style={{ color: active === "up" ? "black" : "gray",fontSize: '2rem', top: '-18px', position: 'absolute'}}
            />
            <ArrowDropDownIcon
                onClick={() => setActive("down")}
                style={{ color: active === "down" ? "black" : "gray", fontSize: '2rem', position: 'absolute' }}
            />
        </Container>
    );
};

export default SortingIcon;
