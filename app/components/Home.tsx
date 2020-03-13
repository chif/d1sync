import React from 'react';
import { remote } from 'electron';
import { Col, Container, Row } from 'react-bootstrap';
import PlaytestListComponent from './PlaytestListComponent';
import UserConfigComponent from './UserConfigComponent';

export default function Home() {
  return (
    <Container>
      <Row>
        <Col>
          <div className="d-inline-flex align-items-baseline">
            <h1 className="display-4">
              <span className="bg-danger">D1</span>
              Playtester
            </h1>
            <span className={process.env.NODE_ENV === 'development' ? 'p-1 bg-danger' : 'mr-2'}>
              <small>{process.env.NODE_ENV === 'development' ? 'dev' : remote.app.getVersion()}</small>
            </span>
          </div>
        </Col>
      </Row>
      <Row>
        <Col>
          <UserConfigComponent />
        </Col>
      </Row>
      <Row>
        <Col>
          <PlaytestListComponent />
        </Col>
      </Row>
    </Container>
  );
}
