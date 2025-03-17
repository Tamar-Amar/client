import React, { useState } from "react";
import { Container, Box, Tabs, Tab, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import { useFetchOperatorById } from "../../queries/operatorQueries";
import OperatorGeneralInfo from "./OperatorGeneralInfo";
import OperatorReport from "./OperatorReport";

const OperatorDetails: React.FC = () => {
  const { id } = useParams();
  const { data: operator, isLoading, isError } = useFetchOperatorById(id!);
  const [tabIndex, setTabIndex] = useState(0);

  if (isLoading) return <div>Loading...</div>;
  if (isError || !operator) return <div>Operator not found.</div>;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ boxShadow: 3, borderRadius: 2, p: 3 }}>
        <Typography variant="h4" gutterBottom textAlign="center" color="primary">
          פרטי מפעיל
        </Typography>

        <Tabs value={tabIndex} onChange={(e, newIndex) => setTabIndex(newIndex)} centered>
          <Tab label="פרטים כלליים" />
          <Tab label="דוח הפעלות" />
        </Tabs>

        <Box sx={{ mt: 3 }}>
          {tabIndex === 0 && <OperatorGeneralInfo operator={operator} />}
          {tabIndex === 1 && <OperatorReport operator={operator} />}
        </Box>
      </Box>
    </Container>
  );
};

export default OperatorDetails;
