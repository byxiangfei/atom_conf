'use babel';

export default class GolangEnv {

  getValuesForVariable(envVar) {
    switch (envVar) {
      case 'GOOS':
        return this.getGOOSValues();
      case 'GOARCH':
        return this.getGOARCHValues();
      default:
        return [];
    }
  }

  getGOOSValues() {
    return [
      'android',
      'darwin',
      'dragonfly',
      'freebsd',
      'linux',
      'nacl',
      'netbsd',
      'openbsd',
      'plan9',
      'solaris',
      'windows',
      'zos'
    ];
  }

  getGOARCHValues() {
    return [
      '386',
      'amd64',
      'amd64p32',
      'arm',
      'armbe',
      'arm64',
      'arm64be',
      'ppc64',
      'ppc64le',
      'mips',
      'mipsle',
      'mips64',
      'mips64le',
      'mips64p32',
      'mips64p32le',
      'ppc',
      's390',
      's390x',
      'sparc',
      'sparc64'
    ];
  }
}
