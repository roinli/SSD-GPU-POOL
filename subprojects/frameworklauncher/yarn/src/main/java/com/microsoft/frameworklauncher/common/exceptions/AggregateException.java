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

package com.opensource-china.frameworklauncher.common.exceptions;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AggregateException extends Exception {

  private final List<Exception> exceptions;

  public AggregateException() {
    this("One or more exceptions occurred.");
  }

  public AggregateException(String message) {
    super(message);
    exceptions = new ArrayList<>();
  }

  public void addException(Exception e) {
    exceptions.add(e);
  }

  public List<Exception> getExceptions() {
    return Collections.unmodifiableList(exceptions);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder("{");
    for (Exception e : exceptions) {
      sb.append(e.toString()).append(", ");
    }
    sb.append("}");
    return "AggregateException[" + sb.toString() + "]";
  }
}
