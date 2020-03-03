import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import PlaytestListComponent from './PlaytestListComponent';
import UserConfigComponent from './UserConfigComponent';

export default function Home() {
  return (
    <Container>
      <Row>
        <Col>
          <h1>
            <span className="bg-danger">D1</span>
            Playtester
          </h1>
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
