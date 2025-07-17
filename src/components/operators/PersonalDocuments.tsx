import React, { useRef, useState } from 'react';
import {
  Box, Button, Typography, TextField, CircularProgress, Table, TableHead,
  TableRow, TableCell, TableBody, Paper, MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useWorkerDocuments } from '../../queries/useDocuments';

interface Props {
  operatorId: string;
}

const TAG_OPTIONS = ['צילום תעודת זהות', 'טופס 101', 'אחר'];

const PersonalDocuments: React.FC<Props> = ({ operatorId }) => {
  const [tag, setTag] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { documents, isLoading, uploadDocument, isUploading } = useWorkerDocuments(operatorId);

  const handleUpload = () => {
    const file = selectedFile;
    const selectedTag = tag === 'אחר' ? customTag : tag;
    if (!file || !selectedTag) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workerId', operatorId);
    formData.append('documentType', selectedTag);
    formData.append('tag', selectedTag);

    uploadDocument(formData);
    setTag('');
    setCustomTag('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const formatSize = (sizeInBytes: number) => {
    if (sizeInBytes > 1024 * 1024) {
      return (sizeInBytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return Math.round(sizeInBytes / 1024) + ' KB';
  };

  const renderIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PictureAsPdfIcon color="error" />;
    if (fileType.includes('image')) return <ImageIcon color="primary" />;
    return <InsertDriveFileIcon />;
  };

  return (
    <Box  sx={{ maxWidth: 1000, mx: 'auto', mt: 4, p: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }} >
      <Typography variant="h6" gutterBottom color="primary">
        העלאת מסמך חדש
      </Typography>

      <Box display="flex" gap={2} alignItems="center" mb={3} flexWrap="wrap">
        <TextField
          select
          label="בחר תגית"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          sx={{ minWidth: 200, flex: 1 }}
        >
          {TAG_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </TextField>

        {tag === 'אחר' && (
          <TextField
            label="תגית חופשית"
            variant="outlined"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            sx={{ flex: 1 }}
          />
        )}

        <input
          type="file"
          hidden
          ref={fileInputRef}
          accept="application/pdf,image/*"
          onChange={handleFileChange}
        />

        <Button
          variant="outlined"
          fullWidth
          sx={{ maxWidth: 200 }}
          onClick={() => fileInputRef.current?.click()}
        >
          {selectedFile ? selectedFile.name : 'בחרי קובץ'}
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!selectedFile || !tag || (tag === 'אחר' && !customTag) || isUploading}
        >
          {isUploading ? <CircularProgress size={20} color="inherit" /> : 'העלה'}
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom color="primary">
        מסמכים קיימים
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : (
        <Paper elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>תגית</TableCell>
                <TableCell>סוג קובץ</TableCell>
                <TableCell>גודל</TableCell>
                <TableCell>תאריך העלאה</TableCell>
                <TableCell>צפייה</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc: any) => (
                <TableRow key={doc._id}>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell>{renderIcon(doc.fileType)}</TableCell>
                  <TableCell>{formatSize(doc.size)}</TableCell>
                  <TableCell>{new Date(doc.uploadedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      לצפייה
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

export default PersonalDocuments;
