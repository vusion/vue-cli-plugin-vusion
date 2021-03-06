import { UTabs } from 'cloud-ui.vusion';

export const UH2Tabs = {
    name: 'u-h2-tabs',
    childName: 'u-h2-tab',
    extends: UTabs,
    props: {
        appear: { type: String, default: 'line' },
    },
};

export default UH2Tabs;
