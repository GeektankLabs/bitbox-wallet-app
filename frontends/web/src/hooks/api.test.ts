/**
 * Copyright 2022 Shift Crypto AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { renderHook } from '@testing-library/react-hooks';
import { TSubscriptionCallback } from '../api/subscribe';
import { useSubscribe, useLoad, useSync } from './api';
import * as utils from './mount';
import { TStatus } from '../api/coins';
import { useState } from 'react';
import { act } from 'react-dom/test-utils';

const useMountedRefSpy = jest.spyOn(utils, 'useMountedRef');

describe('hooks for api calls', () => {
  beforeEach(() => {
    useMountedRefSpy.mockReturnValue({ current: true });
  });

  describe('useLoad', () => {
    it('should load promise and return the correct resolved value', async () => {
      const mockApiCall = jest.fn().mockImplementation(() => Promise.resolve(true));
      const { result, waitForNextUpdate } = renderHook(() => useLoad(mockApiCall));
      await waitForNextUpdate();
      expect(result.current).toBe(true);
    });

    it('re-calls apiCall when dependencies change', async () => {
      // mock apiCall function
      const mockApiCall = jest.fn().mockImplementation(() => Promise.resolve(true));

      // initialize hook with mock apiCall function and initial dependencies
      const { result, waitForNextUpdate } = renderHook(() => {
        const [state, setState] = useState([3]);
        // wrap call to useLoad hook in act
        act(() => {
          //apiCall called for the first time during render
          useLoad(() => mockApiCall(), state);
        });
        return { setState };
      });

      //apiCall called for 2nd time
      act(() => result.current.setState([4]));
      await waitForNextUpdate();

      // for the 3rd
      act(() => result.current.setState([5]));
      await waitForNextUpdate();

      // for the 4th
      act(() => result.current.setState([6]));
      await waitForNextUpdate();

      // assert that apiCall was re-called
      expect(mockApiCall).toHaveBeenCalledTimes(4);
    });
  });

  it('useSubscribe should return proper value of a subscription function', () => {
    const MOCK_RETURN_STATUS: TStatus = {
      tipAtInitTime: 2408855,
      tip: 2408940,
      tipHashHex: '0000000000000015f61742c773181dd368527575a6ac02ea5ecbace8e73cc083',
      targetHeight: 2408940
    };

    const mockSubscribe = jest.fn().mockImplementation(() => (cb: TSubscriptionCallback<any>) => mockSubscribeEndpoint(cb));
    const mockSubscribeEndpoint = jest.fn().mockImplementation((cb) => cb(MOCK_RETURN_STATUS));


    const { result } = renderHook(() => useSubscribe(mockSubscribe()));

    expect(result.current).toBe(MOCK_RETURN_STATUS);
  });

  it('useSync should load promise and sync to a subscription function', async () => {
    const mockApiCall = jest.fn().mockImplementation(() => () => Promise.resolve('some_value'));

    const mockSubscribe = jest.fn().mockImplementation(() => (cb: TSubscriptionCallback<any>) => mockSubscribeEndpoint(cb));
    const mockSubscribeEndpoint = jest.fn().mockImplementation((cb) => cb());

    const { result, waitForNextUpdate } = renderHook(() => useSync(mockApiCall(), mockSubscribe()));

    await waitForNextUpdate();

    expect(mockSubscribe).toHaveBeenCalled();
    expect(mockSubscribeEndpoint).toHaveBeenCalled();

    expect(result.current).toBe('some_value');
  });
});



