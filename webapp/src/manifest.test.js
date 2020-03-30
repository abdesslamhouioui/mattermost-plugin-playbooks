import manifest, {pluginId, pluginVersion} from './manifest';

test('Plugin manifest, id and version are defined', () => {
    expect(manifest).toBeDefined();
    expect(manifest.id).toBeDefined();
    expect(manifest.version).toBeDefined();
});

// To ease migration, verify separate export of id and version.
test('Plugin id and version are defined', () => {
    expect(pluginId).toBeDefined();
    expect(pluginVersion).toBeDefined();
});
