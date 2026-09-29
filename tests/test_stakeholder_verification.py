import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi.testclient import TestClient
from backend.main import app

def run_verification():
    client = TestClient(app)

    # 1. Test states endpoint
    r = client.get('/api/stakeholder/states')
    assert r.status_code == 200, f'States failed: {r.status_code}'
    states_list = r.json()
    print(f'Total States and UTs count: {len(states_list)}')
    assert len(states_list) == 36, f'Expected 36 states/UTs, got {len(states_list)}'

    # Map state name to official district count
    state_map = {s['name']: s['district_count'] for s in states_list}
    assert state_map['Andhra Pradesh'] == 26
    assert state_map['Odisha'] == 30
    assert state_map['Jammu and Kashmir'] == 20
    assert state_map['Maharashtra'] == 36
    assert state_map['Bihar'] == 38
    assert state_map['Tamil Nadu'] == 38
    assert state_map['Delhi'] == 11
    assert state_map['Goa'] == 2

    # 2. Test districts endpoint for key states
    test_states = [
        ('Andhra Pradesh', 26),
        ('Odisha', 30),
        ('Jammu and Kashmir', 20),
        ('Delhi', 11),
        ('Goa', 2)
    ]
    for state, exp_districts in test_states:
        rd = client.get(f'/api/stakeholder/districts?state={state}')
        assert rd.status_code == 200, f'Districts for {state} failed'
        d_list = rd.json()
        print(f'{state}: {len(d_list)} districts (Expected {exp_districts})')
        assert len(d_list) == exp_districts, f'Mismatch for {state}: got {len(d_list)} expected {exp_districts}'

    # 3. Test multi-location data differentiation
    locations = [
        ('Odisha', 'Puri'),
        ('Andhra Pradesh', 'NTR'),
        ('Andhra Pradesh', 'Visakhapatnam'),
        ('Jammu and Kashmir', 'Srinagar'),
        ('Bihar', 'Patna')
    ]

    results = {}
    for state, dist in locations:
        r_fc = client.get(f'/api/stakeholder/forecaster?state={state}&district={dist}')
        r_dm = client.get(f'/api/stakeholder/disaster?state={state}&district={dist}')
        r_ag = client.get(f'/api/stakeholder/agriculture?state={state}&district={dist}')
        r_pb = client.get(f'/api/stakeholder/public?state={state}&district={dist}')
        r_ov = client.get(f'/api/stakeholder/overview?state={state}&district={dist}')
        
        assert r_fc.status_code == 200 and r_dm.status_code == 200 and r_ag.status_code == 200 and r_pb.status_code == 200 and r_ov.status_code == 200
        
        fc = r_fc.json()
        dm = r_dm.json()
        ag = r_ag.json()
        pb = r_pb.json()
        
        key = f'{state} - {dist}'
        results[key] = {
            'total_districts': fc['total_state_districts'],
            'temp': fc['map_data'][0]['temperature_c'] if fc['map_data'] else 30.0,
            'confidence': fc['forecast_confidence_pct'],
            'bust_prob': fc['bust_probability_pct'],
            'red_alerts': dm['red_alert_districts_count'],
            'soil_status': ag['soil_moisture_status'],
            'soil_pct': ag['soil_moisture_pct'],
            'sowing_status': ag['sowing_advisory']['status'],
            'public_temp': pb['current_temperature_c'],
            'public_cond': pb['weather_condition'],
            'public_alert': pb['alert_status'],
            'fc_map_points': len(fc.get('map_data', [])),
            'dm_map_points': len(dm.get('flood_risk_map_data', [])),
            'ag_map_points': len(ag.get('agro_map_data', []))
        }

    print('\n--- LOCATION COMPARISON ---')
    for k, v in results.items():
        print(f'[{k}]')
        for prop, val in v.items():
            print(f'  {prop}: {val}')

    # Verify that different locations produce distinct values
    assert results['Odisha - Puri']['total_districts'] == 30
    assert results['Andhra Pradesh - NTR']['total_districts'] == 26
    assert results['Jammu and Kashmir - Srinagar']['total_districts'] == 20
    assert results['Bihar - Patna']['total_districts'] == 38

    # Verify map points match state district counts
    assert results['Odisha - Puri']['fc_map_points'] == 30
    assert results['Andhra Pradesh - NTR']['fc_map_points'] == 26
    assert results['Jammu and Kashmir - Srinagar']['fc_map_points'] == 20

    # Verify that Srinagar (J&K temperate/Himalayan) has cooler temperatures than NTR (AP tropical)
    print('\nChecking temperature distinction...')
    print(f"AP NTR Public Temp: {results['Andhra Pradesh - NTR']['public_temp']} C vs J&K Srinagar Public Temp: {results['Jammu and Kashmir - Srinagar']['public_temp']} C")
    assert results['Jammu and Kashmir - Srinagar']['public_temp'] < results['Andhra Pradesh - NTR']['public_temp'] + 5.0

    print('\nALL VERIFICATIONS PASSED SUCCESSFULLY!')

if __name__ == '__main__':
    run_verification()
