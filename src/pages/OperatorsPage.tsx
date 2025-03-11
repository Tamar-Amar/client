import React, { useState } from "react";
import { Container, Grid, Typography, Box, Button } from "@mui/material";
import OperatorList from "../components/operators/OperatorList";
import OperatorCreate from "../components/operators/OperatorCreate";

const OperatorsPage: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);

  const toggleCreate = () => {
    setShowCreate((prev) => !prev);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {showCreate ? (

        <Grid container spacing={4}>

          <Grid item xs={12} md={6}>
            <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2 }}>
              <OperatorList />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2 }}>
              <OperatorCreate />
              <Button
                variant="contained"
                color="primary"
                onClick={toggleCreate}
                fullWidth
                sx={{ mt: 2 }}
              >
                סגור טופס הוספת מפעיל
              </Button>
            </Box>
          </Grid>
        </Grid>
      ) : (

        <Box sx={{ position: "relative" }}>
          <Box sx={{ boxShadow: 3, p: 2, borderRadius: 2 }}>
            <OperatorList />
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={toggleCreate}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              minWidth: "auto",
              padding: "8px 12px",
            }}
          >
            הוסף מפעיל
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default OperatorsPage;
