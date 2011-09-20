PKG := webutil/xml

######################################################
# Libraries
######################################################

$(PKG)/xml_writer.o : $(PKG)/xml_writer.h $(PKG)/xml_writer.cc base/*.h
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -c $(PKG)/xml_writer.cc -o $(PKG)/xml_writer.o

######################################################
# Tests
######################################################

TESTS +=\
    $(PKG)/xml_writer_test

$(PKG)/xml_writer_test.o : $(PKG)/xml_writer_test.cc $(PKG)/xml_writer.h $(TEST_HEADERS) base/*.h
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -c $(PKG)/xml_writer_test.cc -o $(PKG)/xml_writer_test.o

$(PKG)/xml_writer_test : $(PKG)/xml_writer.o $(PKG)/xml_writer_test.o third_party/gmock/gmock_main.a base/base.a
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -lpthread $^ -o $@ -lglog