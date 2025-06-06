// Copyright (c) opensource-china Corporation
// All rights reserved. 
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 

package com.opensource-china.frameworklauncher.common.model;

import com.opensource-china.frameworklauncher.common.exts.CommonExts;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class AccessControlList implements Serializable {
  @Valid
  @NotNull
  // Simple Acl:
  // All users can Read, however, only users in the Acl can Write.
  private Set<UserDescriptor> users = new HashSet<>();

  public Set<UserDescriptor> getUsers() {
    return users;
  }

  public void setUsers(Set<UserDescriptor> users) {
    this.users = users;
  }

  public void addUsers(Collection<UserDescriptor> users) {
    this.users.addAll(users);
  }

  public void addUser(UserDescriptor user) {
    users.add(user);
  }

  public boolean containsUser(UserDescriptor user) {
    return users.contains(user);
  }

  @Override
  public String toString() {
    return CommonExts.toString(users);
  }
}
