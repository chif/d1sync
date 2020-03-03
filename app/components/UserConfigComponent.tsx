import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Spinner,
  Row,
  Col,
  Button,
  InputGroup,
  FormControl
} from 'react-bootstrap';
import { loadFtpConfig, selectLibraryPath } from '../actions/playtestActions';
import { D1RootState, FtpConfig, LocalSettings } from '../reducers/types';

export default function UserConfigComponent() {
  const ftpConfig: FtpConfig = useSelector(
    (state: D1RootState) => state.ftpConfig
  );

  const localSettings: LocalSettings = useSelector(
    (state: D1RootState) => state.localSettings
  );

  const dispatch = useDispatch<D1Action>();

  useEffect(() => {
    dispatch(loadFtpConfig());
  }, []);

  const browseClick = useCallback(() => {
    dispatch(selectLibraryPath());
  });

  const getInfo = () => {
    if (ftpConfig.bIsLoading) {
      return <Spinner animation="border" role="status" />;
    }
    return (
      <Row>
        <Col>
          <InputGroup size="lg">
            <InputGroup.Prepend>
              <InputGroup.Text id="basic-addon1">Library path:</InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              aria-label="Large"
              aria-describedby="inputGroup-sizing-sm"
              value={localSettings.libraryPath}
              disabled
            />
            <InputGroup.Append>
              <Button variant="outline-primary" onClick={browseClick}>
                Browse
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Col>
      </Row>
    );
  };
  return getInfo();
}
