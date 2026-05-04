// Minimal license templates. For a real product these should match the
// official SPDX text. Apache and GPL are abbreviated here to keep the
// file readable; replace with full canonical text before public launch.

export function renderLicense(id, year, author) {
  switch (id) {
    case 'MIT':
      return mit(year, author);
    case 'Apache-2.0':
      return apache(year, author);
    case 'GPL-3.0':
      return gpl(year, author);
    case 'Proprietary':
      return proprietary(year, author);
    default:
      return null;
  }
}

function mit(year, author) {
  return `MIT License

Copyright (c) ${year} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

function apache(year, author) {
  return `Apache License 2.0

Copyright ${year} ${author}

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License. You may obtain a copy of
the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied. See the License for the
specific language governing permissions and limitations under the License.

(Replace this file with the full Apache-2.0 text from
https://www.apache.org/licenses/LICENSE-2.0.txt before public release.)
`;
}

function gpl(year, author) {
  return `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) ${year} ${author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

(Replace this file with the full GPL-3.0 text from
https://www.gnu.org/licenses/gpl-3.0.txt before public release.)
`;
}

function proprietary(year, author) {
  return `Copyright (c) ${year} ${author}

All rights reserved.

This source code is proprietary and confidential. Unauthorized copying,
distribution, modification, or use of this code, via any medium, is strictly
prohibited without the express written permission of the copyright holder.
`;
}
