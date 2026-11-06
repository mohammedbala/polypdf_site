import React from 'react';
import { trackEvent } from '../lib/analytics';
export default function SampleLink({ href, children, source = 'samples', feature = 'practice_file', ...rest }) {
  return <a {...rest} href={href} download onClick={() => trackEvent('sample_download', { source, feature })}>{children}</a>;
}
